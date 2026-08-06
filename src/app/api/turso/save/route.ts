import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { loadFromTurso, saveToTurso } from '@/lib/turso'
import { countEntries } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { email, data, allowEmpty } = await request.json()
    if (!email || !data) {
      return NextResponse.json({ error: 'Missing email or data' }, { status: 400 })
    }

    // Verify caller owns this email
    const cookieStore = await cookies()
    const emailCookie = cookieStore.get('google_email')
    if (!emailCookie || emailCookie.value !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Last line of defence. A client that lost its data — stale cache, failed
    // load, old bundle still served from a user's browser — must not be able to
    // blank a populated row. Deleting everything on purpose is still allowed,
    // but only when the client explicitly vouches that the emptiness is real.
    if (countEntries(data) === 0 && !allowEmpty) {
      const existing = await loadFromTurso(email)
      const existingCount = countEntries(existing)
      if (existingCount > 0) {
        console.error(
          `BLOCKED empty overwrite for ${email}: ${existingCount} entries would have been lost`
        )
        return NextResponse.json(
          { error: 'Refusing to overwrite existing data with an empty payload' },
          { status: 409 }
        )
      }
    }

    await saveToTurso(email, data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Turso save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
