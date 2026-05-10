'use client'

import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFilters } from '@/components/product/ProductFilters'
import { useState } from 'react'

interface Category {
  id: string
  name: string
  description?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock_qty: number
  category: string
  image?: string
}

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const { data: rawProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      const filter = selectedCategory ? `category = '${selectedCategory}'` : ''
      const records = await pb.collection('products').getList(1, 50, {
        filter,
        sort: 'name',
      })
      return records.items
    },
  })

  const { data: rawCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const records = await pb.collection('categories').getList(1, 50, {
        sort: 'name',
      })
      return records.items
    },
  })

  const products: Product[] = (rawProducts || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock_qty: p.stock_qty,
    category: p.category,
    image: p.image,
  }))

  const categories: Category[] = (rawCategories || []).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
  }))

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Store</h1>
        <p className="mt-2 text-gray-600">Browse and purchase products</p>
      </div>

      <ProductFilters
        categories={categories || []}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <ProductGrid
        products={products || []}
        loading={productsLoading}
      />
    </div>
  )
}