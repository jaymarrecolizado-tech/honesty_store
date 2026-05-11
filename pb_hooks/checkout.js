/// <reference path="../pb_data/types.d.ts" />

routerAdd('POST', '/checkout', (c) => {
    const { items, paymentType } = $apis.requestInfo(c).body

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Items array is required and cannot be empty')
    }

    if (!paymentType || !['cash', 'debt'].includes(paymentType)) {
        throw new BadRequestError('Valid paymentType is required (cash or debt)')
    }

    // Validate items structure
    for (const item of items) {
        if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
            throw new BadRequestError('Each item must have productId and positive quantity')
        }
    }

    const user = c.get('authRecord')
    if (!user) {
        throw new ForbiddenError('Authentication required')
    }

    const { customerId } = $apis.requestInfo(c).body
    let orderUserId = user.id
    
    // Allow cashiers and admins to place orders on behalf of customers
    if (customerId && (user.getString('role') === 'admin' || user.getString('role') === 'cashier')) {
        orderUserId = customerId
    } else if (paymentType === 'debt' && user.getString('role') === 'cashier') {
        throw new BadRequestError('Customer ID is required for debt payments processed by a cashier')
    }

    // Start transaction
    return $app.dao().runInTransaction(async (tx) => {
        // Get products with row-level locking
        const productIds = items.map(item => item.productId)
        const products = await tx.findRecordsByFilter('products', `id IN (${productIds.map(id => `'${id}'`).join(',')}) FOR UPDATE`)

        // Validate all products exist and have sufficient stock
        let totalAmount = 0
        for (const item of items) {
            const product = products.find(p => p.id === item.productId)
            if (!product) {
                throw new BadRequestError(`Product ${item.productId} not found`)
            }
            if (product.stock_qty < item.quantity) {
                throw new ConflictError(`Insufficient stock for ${product.name}. Available: ${product.stock_qty}, Requested: ${item.quantity}`)
            }
            totalAmount += product.price * item.quantity
        }

        let debtUser = user
        if (orderUserId !== user.id) {
            debtUser = tx.findRecordById('users', orderUserId)
        }

        // Check debt ceiling if debt payment
        if (paymentType === 'debt') {
            const currentBalance = await calculateBalance(tx, orderUserId)
            const debtCeiling = debtUser.getFloat('debt_ceiling') || null

            if (debtCeiling !== null && debtCeiling > 0 && currentBalance + totalAmount > debtCeiling) {
                const remainingCapacity = debtCeiling - currentBalance
                throw new PaymentRequiredError(`Debt ceiling exceeded. Current balance: ${Math.round(currentBalance/100)}, Ceiling: ${Math.round(debtCeiling/100)}, Remaining capacity: ${Math.round(remainingCapacity/100)}, Requested amount: ${Math.round(totalAmount/100)}`)
            }
        }

        // Create order
        const order = new Record('orders')
        order.set('user', orderUserId)
        order.set('total_amount', totalAmount)
        order.set('payment_type', paymentType)
        order.set('status', 'completed')
        await tx.saveRecord(order)

        // Create order items and update stock
        for (const item of items) {
            const product = products.find(p => p.id === item.productId)

            // Order item
            const orderItem = new Record('order_items')
            orderItem.set('order_id', order.id)
            orderItem.set('product_id', product.id)
            orderItem.set('quantity', item.quantity)
            orderItem.set('unit_price', product.price)
            orderItem.set('total_price', product.price * item.quantity)
            await tx.saveRecord(orderItem)

            // Update stock
            product.set('stock_qty', product.stock_qty - item.quantity)
            await tx.saveRecord(product)

            // Stock movement
            const movement = new Record('stock_movements')
            movement.set('product_id', product.id)
            movement.set('quantity_change', -item.quantity)
            movement.set('reason', 'sale')
            movement.set('actor', user.id)
            await tx.saveRecord(movement)
        }

        // Debt ledger if debt payment
        if (paymentType === 'debt') {
            const ledger = new Record('debt_ledger')
            ledger.set('user', orderUserId)
            ledger.set('amount', totalAmount)
            ledger.set('description', `Purchase - Order ${order.id}`)
            await tx.saveRecord(ledger)
        }

        // Audit log
        const audit = new Record('audit_logs')
        audit.set('user', user.id) // keep user.id for the actor who did the action
        audit.set('action', 'checkout')
        audit.set('table_name', 'orders')
        audit.set('record_id', order.id)
        audit.set('new_values', JSON.stringify({
            totalAmount,
            paymentType,
            orderUserId,
            itemCount: items.length,
            items: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }))
        }))
        await tx.saveRecord(audit)

        // Log successful checkout
        $app.logger().info('Checkout completed', {
            orderId: order.id,
            actorId: user.id,
            orderUserId,
            totalAmount,
            paymentType,
            itemCount: items.length
        })

        // Return success response
        const remainingBalance = paymentType === 'debt' ?
            await calculateBalance(tx, orderUserId) : undefined

        return c.json(200, {
            orderId: order.id,
            totalAmount,
            remainingBalance,
            message: 'Checkout completed successfully'
        })
    })
})

async function calculateBalance(tx, userId) {
    const records = await tx.findRecordsByFilter('debt_ledger', `user = '${userId}'`)
    return records.reduce((sum, record) => sum + record.amount, 0)
}