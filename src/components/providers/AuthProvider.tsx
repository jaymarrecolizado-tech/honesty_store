'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import pb from '@/lib/pocketbase'

type TypedAuthStore = typeof pb.authStore

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    const auth = pb.authStore as TypedAuthStore & { record?: { id: string; email: string; name?: string; role?: string; debt_ceiling?: number } | null }

    if (auth.isValid && auth.record) {
      const record = auth.record!
      const role = (record.role as 'customer' | 'admin') ?? 'customer'
      login({
        id: record.id,
        email: record.email,
        name: record.name,
        role,
        debt_ceiling: record.debt_ceiling,
      })
    }

    const unsubscribe = pb.authStore.onChange((token, record) => {
      if (record) {
        login({
          id: record.id,
          email: record.email,
          name: record.name,
          role: record.role,
          debt_ceiling: record.debt_ceiling,
        })
      } else {
        logout()
      }
    })

    return unsubscribe
  }, [login, logout])

  return <>{children}</>
}