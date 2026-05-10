import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pb from '@/lib/pocketbase'

export async function middleware(request: NextRequest) {
  // Check if user is authenticated
  const cookieString = request.headers.get('cookie') || ''
  pb.authStore.loadFromCookie(cookieString)

  const isAuthenticated = pb.authStore.isValid
  const user = (pb.authStore as unknown as { record: { role?: string } | null }).record
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register']
  const isPublicRoute = publicRoutes.includes(pathname)

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