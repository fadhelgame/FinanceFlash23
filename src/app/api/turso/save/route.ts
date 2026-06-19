import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { saveToTurso } from '@/lib/turso'

export async function POST(request: NextRequest) {
  try {
    const { email, data } = await request.json()
    if (!email || !data) {
      return NextResponse.json({ error: 'Missing email or data' }, { status: 400 })
    }

    // Verify caller owns this email
    const cookieStore = await cookies()
    const emailCookie = cookieStore.get('google_email')
    if (!emailCookie || emailCookie.value !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await saveToTurso(email, data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Turso save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
