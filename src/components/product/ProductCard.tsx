'use client'

import Image from 'next/image'
import { useCartStore } from '@/stores/cart'
import { Plus } from 'lucide-react'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock_qty: number
  category: string
  image?: string
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()

  const handleAddToCart = () => {
    if (product.stock_qty <= 0) return

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    })
  }

  return (
    <div className="card group">
      {product.image && (
        <div className="aspect-square relative mb-4 overflow-hidden rounded-md">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ₱{(product.price / 100).toFixed(2)}
          </span>

          <span className={`text-sm ${
            product.stock_qty > 10
              ? 'text-green-600'
              : product.stock_qty > 0
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}>
            {product.stock_qty > 0 ? `${product.stock_qty} left` : 'Out of stock'}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock_qty <= 0}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}