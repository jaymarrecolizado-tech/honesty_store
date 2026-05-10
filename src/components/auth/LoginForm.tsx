'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import pb from '@/lib/pocketbase'
import { useAuthStore } from '@/stores/auth'

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (isLogin) {
        result = await pb.collection('users').authWithPassword(email, password)
      } else {
        result = await pb.collection('users').create({
          email,
          password,
          passwordConfirm: password,
          name,
        })
        // Auto-login after registration
        result = await pb.collection('users').authWithPassword(email, password)
      }

      login({
        id: result.record.id,
        email: result.record.email,
        name: result.record.name,
        role: result.record.role,
        debt_ceiling: result.record.debt_ceiling,
      })

      // Redirect based on role
      if (result.record.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/store')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex justify-center space-x-1 mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isLogin
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            !isLogin
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              required={!isLogin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mt-1"
              placeholder="Your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
            placeholder="Your password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}