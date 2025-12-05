import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/', '/session']
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  const isPublicRoute = publicRoutes.includes(path)

  const apiKey = request.cookies.get('apiKey')?.value

  if (isProtectedRoute && !apiKey) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicRoute && apiKey) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)']
}
