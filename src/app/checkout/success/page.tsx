'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, Receipt, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close()
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-500">Order Reference</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{orderId}</p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-left p-3 bg-blue-50 rounded-lg">
            <Receipt className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Please take your items from the store shelf.
            </p>
          </div>
          <div className="flex items-center gap-3 text-left p-3 bg-amber-50 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              For <strong>debt orders</strong>, please record your transaction in the debt ledger.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/store"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/profile"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View Order History
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          This window will close automatically in 30 seconds.
        </p>
      </div>
    </div>
  )
}