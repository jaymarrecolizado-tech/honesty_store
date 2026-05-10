import { create } from 'zustand'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock_qty: number
  category: string
  image?: string
  created: string
  updated: string
}

interface Category {
  id: string
  name: string
  description?: string
}

interface ProductState {
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string | null
  setProducts: (products: Product[]) => void
  setCategories: (categories: Category[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateProductStock: (productId: string, newStock: number) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateProductStock: (productId, newStock) => {
    set({
      products: get().products.map(product =>
        product.id === productId
          ? { ...product, stock_qty: newStock }
          : product
      ),
    })
  },
}))