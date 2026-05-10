'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import pb from '@/lib/pocketbase'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = getTotal()

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const checkoutData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentType,
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify(checkoutData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Checkout failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      clearCart()
      router.push(`/checkout/success?orderId=${data.orderId}`)
    },
    onError: (error: any) => {
      setError(error.message)
    },
    onSettled: () => {
      setLoading(false)
    },
  })

  const handleCheckout = () => {
    setLoading(true)
    setError('')
    checkoutMutation.mutate()
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <a href="/store" className="btn btn-primary">
            Continue Shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ₱{(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium">
                    ₱{((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₱{(total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentType"
                  value="cash"
                  checked={paymentType === 'cash'}
                  onChange={(e) => setPaymentType(e.target.value as 'cash' | 'debt')}
                  className="mr-3"
                />
                <span className="font-medium">Cash Payment</span>
              </label>

              {user?.role === 'customer' && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    value="debt"
                    checked={paymentType === 'debt'}
                    onChange={(e) => setPaymentType(e.target.value as 'cash' | 'debt')}
                    className="mr-3"
                  />
                  <span className="font-medium">Charge to Account (Utang)</span>
                  {user.debt_ceiling && (
                    <span className="text-sm text-gray-600 ml-2">
                      (Limit: ₱{(user.debt_ceiling / 100).toFixed(2)})
                    </span>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Complete Order</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary w-full text-lg py-3"
            >
              {loading ? 'Processing...' : `Pay ₱${(total / 100).toFixed(2)}`}
            </button>

            <p className="text-sm text-gray-600 mt-3 text-center">
              By completing your order, you agree to our terms of service.
            </p>
          </div>

          <div className="text-center">
            <a href="/store" className="text-primary-600 hover:text-primary-700">
              ← Continue Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}