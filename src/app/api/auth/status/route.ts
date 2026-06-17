import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const tokens = cookieStore.get('google_tokens')
  const email = cookieStore.get('google_email')

  if (!tokens) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    email: email?.value,
  })
}
