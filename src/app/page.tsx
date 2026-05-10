import { LoginForm } from '@/components/auth/LoginForm'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Electronic Honesty Store
          </h1>
          <p className="mt-2 text-gray-600">
            Self-service POS and inventory system
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}