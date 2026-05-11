'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { useAuthStore } from '@/stores/auth'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock_qty: number
  category: string
  expand?: { category: { name: string } }
}

interface CartItem {
  product: Product
  quantity: number
}

type PaymentType = 'cash' | 'debt'

export default function CashierPOSPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentType, setPaymentType] = useState<PaymentType>('cash')
  const [customerEmail, setCustomerEmail] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pos-products', selectedCategory],
    queryFn: async () => {
      const filter = selectedCategory ? `category = '${selectedCategory}'` : ''
      const records = await pb.collection('products').getList(1, 100, {
        filter,
        sort: 'name',
        expand: 'category',
      })
      return records.items as unknown as Product[]
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const records = await pb.collection('categories').getList(1, 50, { sort: 'name' })
      return records.items
    },
  })

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_qty) return prev
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.product.id !== id))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setProcessing(true)
    setError('')

    try {
      // If debt payment, look up customer
      let customerId = user?.id
      if (paymentType === 'debt' && customerEmail) {
        const customers = await pb.collection('users').getList(1, 1, {
          filter: `email = '${customerEmail}'`,
        })
        if (customers.items.length === 0) {
          throw new Error(`No customer found with email: ${customerEmail}`)
        }
        customerId = customers.items[0].id
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          paymentType,
          customerId,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Checkout failed')
      }

      setSuccess(true)
      setCart([])
      setCustomerEmail('')
      setPaymentType('cash')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Product browser */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 p-4 gap-3">
          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading products...</div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
              {filtered.map(product => {
                const inCart = cart.find(i => i.product.id === product.id)
                const outOfStock = product.stock_qty === 0
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && addToCart(product)}
                    disabled={outOfStock}
                    className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      inCart ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                    } ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-400">{product.expand?.category?.name || ''}</span>
                      {inCart && (
                        <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                          ×{inCart.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</p>
                    <p className="text-blue-600 font-bold mt-2">₱{product.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Stock: {product.stock_qty}</p>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400 text-sm">No products found.</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Cart + checkout */}
        <div className="w-80 xl:w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Current Order</h2>
            <p className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCartIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tap products to add</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">₱{item.product.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 rounded hover:bg-gray-200">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock_qty}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right min-w-[56px]">
                    <p className="text-sm font-bold text-gray-900">₱{(item.product.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 mt-0.5">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment section */}
          <div className="border-t p-4 space-y-4">
            {/* Payment type */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentType('cash')}
                  className={`flex items-center gap-2 justify-center py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    paymentType === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentType('debt')}
                  className={`flex items-center gap-2 justify-center py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    paymentType === 'debt' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Utang
                </button>
              </div>
            </div>

            {/* Customer email for debt */}
            {paymentType === 'debt' && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Customer Email (for Utang)</p>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center bg-gray-900 text-white rounded-xl px-4 py-3">
              <span className="text-sm font-medium">TOTAL</span>
              <span className="text-xl font-bold">₱{cartTotal.toFixed(2)}</span>
            </div>

            {/* Error */}
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <p className="text-xs font-medium">Order placed successfully!</p>
              </div>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing || (paymentType === 'debt' && !customerEmail)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : `Confirm Payment · ₱${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}
