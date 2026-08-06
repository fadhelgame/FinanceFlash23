import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getValidTokensResult, SESSION_MAX_AGE } from '@/lib/google-oauth'

export async function GET() {
  const cookieStore = await cookies()
  const email = cookieStore.get('google_email')

  // `revoked` is the only thing that ends a session. A failed refresh that was
  // merely transient keeps the user signed in — being briefly offline is not a
  // logout.
  const { revoked } = await getValidTokensResult()
  if (revoked) {
    return NextResponse.json({ authenticated: false })
  }

  const response = NextResponse.json({
    authenticated: true,
    email: email?.value,
  })

  // Slide the email cookie forward on every check so an actively used session
  // never reaches its expiry.
  if (email?.value) {
    response.cookies.set('google_email', email.value, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  }

  return response
}
