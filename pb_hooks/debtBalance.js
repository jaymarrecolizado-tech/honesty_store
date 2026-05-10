/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/debt/balance', (c) => {
    const user = c.get('authRecord')
    if (!user) {
        throw new ForbiddenError('Authentication required')
    }

    const userId = c.queryParam('userId') || user.id

    // Allow users to check their own balance, or admins to check anyone's balance
    if (userId !== user.id && user.role !== 'admin') {
        throw new ForbiddenError('Access denied')
    }

    // Verify target user exists
    return $app.dao().findRecordById('_auth', userId).then(targetUser => {
        if (!targetUser) {
            throw new BadRequestError('User not found')
        }

        // Calculate balance
        return $app.dao().findRecordsByFilter('debt_ledger', `user = '${userId}'`).then(records => {
            const balance = records.reduce((sum, record) => sum + record.amount, 0)
            const ceiling = targetUser.debt_ceiling || null
            const remainingCapacity = ceiling !== null ? ceiling - balance : null

            // Get last payment date
            const paymentRecords = records.filter(r => r.amount < 0)
            const lastPayment = paymentRecords.length > 0 ?
                paymentRecords.sort((a, b) => new Date(b.created) - new Date(a.created))[0].created :
                null

            return c.json(200, {
                userId,
                balance,
                ceiling,
                remainingCapacity,
                lastPayment,
                currency: 'PHP', // Assuming Philippine Peso (cents)
                message: 'Balance retrieved successfully'
            })
        })
    })
})