'use client'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import pb from '@/lib/pocketbase'
import { ShoppingCart, LayoutDashboard, Database, LogOut, Package } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    pb.authStore.clear()
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Admin Portal</h1>
            <p className="text-xs text-gray-500">Electronic Honesty Store</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.name || user?.email}</p>
            <p className="text-xs text-blue-600 font-medium">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-1">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Storefront Link */}
          <Link
            href="/store"
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center text-center gap-4"
          >
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Customer Storefront</h3>
              <p className="text-sm text-gray-500 mt-1">View the store as a customer sees it</p>
            </div>
          </Link>

          {/* Cashier POS Link */}
          <Link
            href="/cashier"
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center text-center gap-4"
          >
            <div className="bg-green-50 text-green-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Cashier POS</h3>
              <p className="text-sm text-gray-500 mt-1">Process walk-in transactions & view reports</p>
            </div>
          </Link>

          {/* PocketBase Admin UI Link */}
          <a
            href="/_/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center text-center gap-4"
          >
            <div className="bg-orange-50 text-orange-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Database className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Database & Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">Manage products, users, and raw data</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  )
}
