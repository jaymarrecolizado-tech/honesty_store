/// <reference path="../pb_data/types.d.ts" />

routerAdd('POST', '/debt/payments', (c) => {
    const user = c.get('authRecord')
    if (!user) {
        throw new ForbiddenError('Authentication required')
    }

    if (user.role !== 'admin') {
        throw new ForbiddenError('Admin access required for debt payments')
    }

    const { userId, amount, description } = $apis.requestInfo(c).body

    // Validate input
    if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid userId is required')
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new BadRequestError('Valid positive amount is required')
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw new BadRequestError('Description is required')
    }

    // Start transaction
    return $app.dao().runInTransaction(async (tx) => {
        // Verify user exists
        const targetUser = await tx.findRecordById('_auth', userId)
        if (!targetUser) {
            throw new BadRequestError('User not found')
        }

        // Create debt ledger entry (negative amount for payment received)
        const ledger = new Record('debt_ledger')
        ledger.set('user', userId)
        ledger.set('amount', -Math.abs(amount)) // Ensure negative
        ledger.set('description', description.trim())
        await tx.saveRecord(ledger)

        // Audit log
        const audit = new Record('audit_logs')
        audit.set('user', user.id)
        audit.set('action', 'debt_payment')
        audit.set('table_name', 'debt_ledger')
        audit.set('record_id', ledger.id)
        audit.set('new_values', JSON.stringify({
            userId,
            amount: -Math.abs(amount),
            description: description.trim()
        }))
        await tx.saveRecord(audit)

        // Calculate new balance
        const newBalance = await calculateBalance(tx, userId)

        // Log debt payment
        $app.logger().info('Debt payment recorded', {
            ledgerId: ledger.id,
            userId,
            amount: -Math.abs(amount),
            newBalance,
            recordedBy: user.id
        })

        return c.json(200, {
            ledgerId: ledger.id,
            userId,
            amount: -Math.abs(amount),
            newBalance,
            message: 'Debt payment recorded successfully'
        })
    })
})

async function calculateBalance(tx, userId) {
    const records = await tx.findRecordsByFilter('debt_ledger', `user = '${userId}'`)
    return records.reduce((sum, record) => sum + record.amount, 0)
}