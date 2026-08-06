import { NextResponse } from 'next/server'

// The only path that ends a session. Everything else — expired access tokens,
// Google outages, offline devices — is recoverable and must leave the cookies
// alone.
export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set('google_tokens', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  response.cookies.set('google_email', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
