import { NextResponse } from 'next/server'
import { FILE_NAME, getValidTokens } from '@/lib/google-oauth'

// A failed request must never look like "this user has no data" — the caller
// would treat the empty result as authoritative and sync it back over the
// real data. Only a genuine absence of the file returns null.
export async function GET() {
  try {
    const tokens = await getValidTokens()
    if (!tokens) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (!searchResponse.ok) {
      console.error('Drive search failed:', searchResponse.status, await searchResponse.text())
      return NextResponse.json({ error: 'Drive unavailable' }, { status: 502 })
    }

    const searchResult = await searchResponse.json()
    // No file at all — this user really has never saved anything.
    if (!searchResult.files || searchResult.files.length === 0) {
      return NextResponse.json(null)
    }

    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${searchResult.files[0].id}?alt=media`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (!downloadResponse.ok) {
      console.error('Drive download failed:', downloadResponse.status)
      return NextResponse.json({ error: 'Drive unavailable' }, { status: 502 })
    }

    const data = await downloadResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Load from Drive error:', error)
    return NextResponse.json({ error: 'Drive unavailable' }, { status: 502 })
  }
}
