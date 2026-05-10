'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { User, CreditCard, History, LogOut, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

type Order = {
  id: string
  collectionId: string
  collectionName: string
  created: string
  total_amount: number
  payment_type: string
  status: string
  expand?: {
    'order_items(order_id)'?: OrderItem[]
  }
}

type OrderItem = {
  id: string
  product: string
  quantity: number
  price: number
  productName?: string
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'orders' | 'debt'>('orders')

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return []
      const records = await pb.collection('orders').getList(1, 20, {
        filter: `user = '${user.id}'`,
        sort: '-created',
        expand: 'order_items',
      })
      return records.items as unknown as Order[]
    },
    enabled: !!user,
  })

  const { data: debtInfo } = useQuery({
    queryKey: ['debt-balance', user?.id],
    queryFn: async () => {
      if (!user) return null
      const res = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/debt_balance/current`, {
        headers: {
          Authorization: `Bearer ${pb.authStore.token}`,
        },
      })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!user && user.role !== 'admin',
  })

  const payDebt = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/debt_payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) throw new Error('Payment failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debt-balance'] })
      alert('Payment recorded successfully.')
    },
    onError: () => {
      alert('Failed to record payment. Please try again.')
    },
  })

  const handleLogout = () => {
    pb.authStore.clear()
    logout()
    router.push('/')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (!user) return null

  const debtBalance = debtInfo?.balance || 0
  const debtCeiling = user.debt_ceiling || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name || user.email}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {user.role === 'customer' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Debt Account</h3>
                <p className="text-sm text-gray-500">Manage your credit account</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(debtBalance)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-700">{formatPrice(debtCeiling)}</p>
              </div>
            </div>
            {debtBalance > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={() => payDebt.mutate(debtBalance)}
                  disabled={payDebt.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Pay Full Amount
                </button>
                <button
                  onClick={() => {
                    const amt = prompt('Enter payment amount (PHP):')
                    if (amt && !isNaN(Number(amt))) {
                      payDebt.mutate(Number(amt))
                    }
                  }}
                  disabled={payDebt.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg font-medium hover:bg-green-50 disabled:opacity-50"
                >
                  Pay Custom Amount
                </button>
              </div>
            )}
            {debtBalance === 0 && (
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your account is settled. Thank you!
              </p>
            )}
            {debtBalance > 0 && debtBalance >= debtCeiling && (
              <p className="text-sm text-amber-600 flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                You have reached your credit limit. Please pay your balance before making new debt purchases.
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <History className="h-4 w-4" />
              Order History
            </button>
          </div>

          <div className="divide-y">
            {ordersLoading ? (
              <div className="p-8 text-center text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders yet. Start shopping!</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(order.created), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        order.payment_type === 'cash' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.payment_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                    {order.expand?.['order_items(order_id)'] && (
                      <span className="text-gray-500">
                        {(order.expand['order_items(order_id)'] as unknown as OrderItem[]).length} item(s)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}