import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pb from '@/lib/pocketbase'

export async function middleware(request: NextRequest) {
  // Check if user is authenticated
  const authCookie = request.cookies.get('pb_auth')
  if (authCookie) {
    pb.authStore.loadFromCookie(authCookie.value)
  }

  const isAuthenticated = pb.authStore.isValid
  const user = pb.authStore.record as { role?: string } | null
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Admin routes
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Store routes (for customers)
  const storeRoutes = ['/store', '/product', '/cart', '/checkout', '/profile']
  const isStoreRoute = storeRoutes.some(route => pathname.startsWith(route))

  // Redirect logic
  if (!isAuthenticated && !isPublicRoute) {
    // Redirect to login for protected routes
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isAuthenticated) {
    if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register') {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL('/store', request.url))
    }

    // Role-based access control
    if (user?.role === 'customer' && isAdminRoute) {
      return NextResponse.redirect(new URL('/store', request.url))
    }

    if (user?.role === 'admin' && isStoreRoute && !pathname.startsWith('/profile')) {
      // Allow admins to access store pages but redirect from pure store routes
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // Set user role header for server components
  const response = NextResponse.next()
  response.headers.set('x-user-role', user?.role || 'anonymous')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}