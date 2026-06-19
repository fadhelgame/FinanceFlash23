import { NextRequest, NextResponse } from 'next/server'
import { loadFromTurso } from '@/lib/turso'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }
    const data = await loadFromTurso(email)
    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Turso load error:', error)
    return NextResponse.json({ error: 'Load failed' }, { status: 500 })
  }
}
