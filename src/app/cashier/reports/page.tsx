'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { TrendingUp, ShoppingBag, CreditCard, Banknote, Calendar } from 'lucide-react'

interface Order {
  id: string
  total_amount: number
  payment_type: 'cash' | 'debt'
  status: 'pending' | 'completed' | 'cancelled'
  created: string
  expand?: {
    user?: { name?: string; email: string }
  }
}

interface OrderItem {
  id: string
  order_id: string
  quantity: number
  unit_price: number
  total_price: number
  expand?: {
    product_id?: { name: string }
  }
}

type DateRange = 'today' | 'week' | 'month'

function getDateFilter(range: DateRange): string {
  const now = new Date()
  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return `created >= '${start.toISOString()}'`
  }
  if (range === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    return `created >= '${start.toISOString()}'`
  }
  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return `created >= '${start.toISOString()}'`
}

export default function CashierReportsPage() {
  const [range, setRange] = useState<DateRange>('today')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['cashier-orders', range],
    queryFn: async () => {
      const filter = `status = 'completed' && ${getDateFilter(range)}`
      const records = await pb.collection('orders').getList(1, 200, {
        filter,
        sort: '-created',
        expand: 'user',
      })
      return records.items as unknown as Order[]
    },
  })

  // Aggregated stats
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0)
  const cashOrders = orders.filter(o => o.payment_type === 'cash')
  const debtOrders = orders.filter(o => o.payment_type === 'debt')
  const cashRevenue = cashOrders.reduce((s, o) => s + o.total_amount, 0)
  const debtRevenue = debtOrders.reduce((s, o) => s + o.total_amount, 0)

  const rangeLabels: Record<DateRange, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "This Month",
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of completed transactions</p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['today', 'week', 'month'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          label="Total Revenue"
          value={`₱${totalRevenue.toFixed(2)}`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5 text-violet-600" />}
          label="Orders"
          value={orders.length.toString()}
          bg="bg-violet-50"
        />
        <StatCard
          icon={<Banknote className="h-5 w-5 text-green-600" />}
          label="Cash Sales"
          value={`₱${cashRevenue.toFixed(2)}`}
          sub={`${cashOrders.length} orders`}
          bg="bg-green-50"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-orange-600" />}
          label="Utang (Debt)"
          value={`₱${debtRevenue.toFixed(2)}`}
          sub={`${debtOrders.length} orders`}
          bg="bg-orange-50"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Transaction History — {rangeLabels[range]}</h2>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading transactions...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No completed orders for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Date & Time</th>
                  <th className="px-6 py-3 text-left">Payment</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3 text-gray-800">
                      {order.expand?.user?.name || order.expand?.user?.email || '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(order.created).toLocaleString('en-PH', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_type === 'cash'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.payment_type === 'cash' ? '💵 Cash' : '📋 Utang'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      ₱{order.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={4} className="px-6 py-3 font-semibold text-gray-700">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 text-base">
                    ₱{totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4">
      <div className={`${bg} rounded-lg p-2.5`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
