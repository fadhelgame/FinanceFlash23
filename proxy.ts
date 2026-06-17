import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tokens = request.cookies.get('google_tokens')

  // Allow static files, auth pages, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // If not authenticated, redirect to login
  if (!tokens && !process.env.GOOGLE_CLIENT_ID) {
    // No Google config yet — allow access anyway (uses localStorage)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
