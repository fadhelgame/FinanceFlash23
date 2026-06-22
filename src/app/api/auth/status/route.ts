import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getValidTokens } from '@/lib/google-oauth'

export async function GET() {
  const cookieStore = await cookies()
  const email = cookieStore.get('google_email')

  // Validate tokens — this auto-refreshes if expired, returns null if refresh fails
  const tokens = await getValidTokens()
  if (!tokens) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    email: email?.value,
  })
}
