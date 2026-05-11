'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import pb from '@/lib/pocketbase'
import { ShoppingCart, BarChart2, LogOut, Package } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    pb.authStore.clear()
    logout()
    router.push('/')
  }

  const navItems = [
    { href: '/cashier', label: 'POS', icon: ShoppingCart },
    { href: '/cashier/reports', label: 'Reports', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-2">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Honesty Store</p>
              <p className="font-semibold text-sm">Cashier Terminal</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Cashier</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
