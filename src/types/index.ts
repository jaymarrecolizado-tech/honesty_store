export type Category = {
  id: string
  name: string
  description: string
  image: string
  product_count?: number
}

export type Product = {
  id: string
  category: string
  name: string
  description: string
  price: number
  image: string
  stock_qty: number
  sku: string
  is_active: boolean
  created?: string
  updated?: string
  expand?: {
    category?: Category
  }
}

export type Order = {
  id: string
  customer: string
  total_amount: number
  payment_type: 'cash' | 'debt'
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  created: string
  expand?: {
    order_items?: OrderItem[]
  }
}

export type OrderItem = {
  id: string
  order: string
  product: string
  quantity: number
  unit_price: number
  subtotal: number
  expand?: {
    product?: Product
  }
}

export type DebtTransaction = {
  id: string
  customer: string
  amount: number
  type: 'charge' | 'payment'
  order?: string
  notes?: string
  created: string
}

export type User = {
  id: string
  email: string
  name?: string
  role: 'customer' | 'admin'
  debt_ceiling?: number
}

export type CartItem = {
  product: Product
  quantity: number
}