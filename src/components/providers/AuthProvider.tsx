'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import pb from '@/lib/pocketbase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    // Load auth state on mount
    if (pb.authStore.isValid && pb.authStore.record) {
      login({
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        name: pb.authStore.record.name,
        role: pb.authStore.record.role,
        debt_ceiling: pb.authStore.record.debt_ceiling,
      })
    }

    // Listen for auth changes
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