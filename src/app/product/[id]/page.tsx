'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import pb from '@/lib/pocketbase'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, ShoppingCart, Minus, Plus, Tag, Package } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const { addItem } = useCartStore()
  const { user } = useAuthStore()
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const record = await pb.collection('products').getOne(productId, {
        expand: 'category',
      })
      return record
    },
  })

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image || undefined,
    })
    router.push('/store')
  }

  const getStockBadge = () => {
    if (!product) return null
    if (product.stock_qty <= 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Out of Stock</span>
    }
    if (product.stock_qty <= 5) {
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Low Stock ({product.stock_qty})</span>
    }
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">In Stock ({product.stock_qty})</span>
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
        <Link href="/store" className="text-primary-600 hover:underline">Back to store</Link>
      </div>
    )
  }

  const maxQty = Math.min(product.stock_qty, 20)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {product.image ? (
            <div className="aspect-video bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="h-20 w-20 text-gray-300" />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {product.expand?.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      <Tag className="h-3 w-3" />
                      {product.expand.category.name}
                    </span>
                  )}
                  {getStockBadge()}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              </div>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </p>
            </div>

            {product.description && (
              <p className="text-gray-600 mb-6">{product.description}</p>
            )}

            {user && product.stock_qty > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      disabled={quantity >= maxQty}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add {quantity} to Cart
                </button>

                <p className="text-center text-sm text-gray-500 mt-3">
                  Total: <strong>{formatPrice(product.price * quantity)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}