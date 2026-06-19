import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { loadFromTurso } from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // Verify caller owns this email
    const cookieStore = await cookies()
    const emailCookie = cookieStore.get('google_email')
    if (!emailCookie || emailCookie.value !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await loadFromTurso(email)
    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Turso load error:', error)
    return NextResponse.json({ error: 'Load failed' }, { status: 500 })
  }
}
