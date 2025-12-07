import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isAuthenticated = req.cookies.has('api_key')

  const protectedPaths = ['/dashboard', '/sessions']
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (path === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/sessions', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/sessions/:path*', '/login'],
}
