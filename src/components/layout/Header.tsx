'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import pb from '@/lib/pocketbase'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, logout } = useAuthStore()
  const { getItemCount } = useCartStore()
  const router = useRouter()
  const itemCount = getItemCount()

  const handleLogout = async () => {
    pb.authStore.clear()
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/store" className="text-xl font-bold text-gray-900">
            Electronic Honesty Store
          </Link>

          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <User className="h-6 w-6" />
                </Link>

                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}