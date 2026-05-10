/// <reference path="../pb_data/types.d.ts" />

// Stock levels report
routerAdd('GET', '/reports/stock-levels', (c) => {
    const user = c.get('authRecord')
    if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required')
    }

    const categoryFilter = c.queryParam('category') || ''
    const lowStockOnly = c.queryParam('lowStock') === 'true'

    let filter = ''
    if (categoryFilter) {
        filter += `category = '${categoryFilter}'`
    }
    if (lowStockOnly) {
        filter += (filter ? ' && ' : '') + 'stock_qty < 10'
    }

    return $app.dao().findRecordsByFilter('products', filter, '-stock_qty').then(products => {
        const summary = {
            totalProducts: products.length,
            lowStockCount: products.filter(p => p.stock_qty < 10).length,
            outOfStockCount: products.filter(p => p.stock_qty === 0).length,
            totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_qty), 0)
        }

        const items = products.map(product => ({
            productId: product.id,
            name: product.name,
            stockQty: product.stock_qty,
            unitPrice: product.price,
            totalValue: product.price * product.stock_qty,
            category: product.category,
            lowStock: product.stock_qty < 10,
            outOfStock: product.stock_qty === 0
        }))

        return c.json(200, {
            items,
            summary,
            generatedAt: new Date().toISOString(),
            message: 'Stock levels report generated successfully'
        })
    })
})

// Debt summary report
routerAdd('GET', '/reports/debt-summary', (c) => {
    const user = c.get('authRecord')
    if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required')
    }

    return $app.dao().findRecordsByFilter('debt_ledger', '', 'created').then(allDebts => {
        // Group by user
        const userDebts = {}
        allDebts.forEach(record => {
            if (!userDebts[record.user]) {
                userDebts[record.user] = []
            }
            userDebts[record.user].push(record)
        })

        const userSummaries = []
        let totalDebt = 0

        for (const [userId, debts] of Object.entries(userDebts)) {
            const balance = debts.reduce((sum, record) => sum + record.amount, 0)
            if (balance > 0) { // Only show users with outstanding debt
                const userRecord = await $app.dao().findRecordById('_auth', userId)
                userSummaries.push({
                    userId,
                    name: userRecord?.name || userRecord?.email || 'Unknown',
                    balance,
                    transactionCount: debts.length,
                    lastActivity: debts[debts.length - 1].created
                })
                totalDebt += balance
            }
        }

        // Sort by balance descending
        userSummaries.sort((a, b) => b.balance - a.balance)
        const topDebtors = userSummaries.slice(0, 10)

        // Debt distribution
        const distribution = {
            '0-1000': userSummaries.filter(u => u.balance > 0 && u.balance <= 1000).length,
            '1000-5000': userSummaries.filter(u => u.balance > 1000 && u.balance <= 5000).length,
            '5000-10000': userSummaries.filter(u => u.balance > 5000 && u.balance <= 10000).length,
            '10000+': userSummaries.filter(u => u.balance > 10000).length
        }

        return c.json(200, {
            totalDebt,
            userCount: userSummaries.length,
            topDebtors,
            debtDistribution: distribution,
            averageDebt: userSummaries.length > 0 ? Math.round(totalDebt / userSummaries.length) : 0,
            generatedAt: new Date().toISOString(),
            message: 'Debt summary report generated successfully'
        })
    })
})

// Sales report
routerAdd('GET', '/reports/sales', (c) => {
    const user = c.get('authRecord')
    if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required')
    }

    const startDate = c.queryParam('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = c.queryParam('endDate') || new Date().toISOString().split('T')[0]
    const category = c.queryParam('category') || ''
    const paymentType = c.queryParam('paymentType') || ''

    let filter = `created >= '${startDate}' && created <= '${endDate} 23:59:59'`
    if (paymentType) {
        filter += ` && payment_type = '${paymentType}'`
    }

    return $app.dao().findRecordsByFilter('orders', filter).then(orders => {
        let filteredOrders = orders

        if (category) {
            // Get order items for category filtering
            const orderIds = orders.map(o => o.id)
            const orderItems = await $app.dao().findRecordsByFilter('order_items',
                `order_id IN (${orderIds.map(id => `'${id}'`).join(',')})`)

            // Filter orders that have items in the specified category
            const filteredOrderIds = new Set()
            for (const item of orderItems) {
                const product = await $app.dao().findRecordById('products', item.product_id)
                if (product.category === category) {
                    filteredOrderIds.add(item.order_id)
                }
            }
            filteredOrders = orders.filter(o => filteredOrderIds.has(o.id))
        }

        const summary = {
            totalSales: filteredOrders.reduce((sum, o) => sum + o.total_amount, 0),
            totalOrders: filteredOrders.length,
            avgOrderValue: filteredOrders.length > 0 ?
                Math.round(filteredOrders.reduce((sum, o) => sum + o.total_amount, 0) / filteredOrders.length) : 0,
            cashSales: filteredOrders.filter(o => o.payment_type === 'cash').reduce((sum, o) => sum + o.total_amount, 0),
            debtSales: filteredOrders.filter(o => o.payment_type === 'debt').reduce((sum, o) => sum + o.total_amount, 0)
        }

        // Daily breakdown (simplified - would need date grouping in real implementation)
        const dailyBreakdown = []
        const dateGroups = {}
        filteredOrders.forEach(order => {
            const date = order.created.split('T')[0]
            if (!dateGroups[date]) {
                dateGroups[date] = { sales: 0, orders: 0 }
            }
            dateGroups[date].sales += order.total_amount
            dateGroups[date].orders += 1
        })

        Object.entries(dateGroups).forEach(([date, data]) => {
            dailyBreakdown.push({
                date,
                sales: data.sales,
                orders: data.orders
            })
        })

        dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date))

        return c.json(200, {
            period: { start: startDate, end: endDate },
            summary,
            dailyBreakdown,
            filters: {
                category: category || null,
                paymentType: paymentType || null
            },
            generatedAt: new Date().toISOString(),
            message: 'Sales report generated successfully'
        })
    })
})