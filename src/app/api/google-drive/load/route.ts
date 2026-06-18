import { NextResponse } from 'next/server'
import { FILE_NAME, getTokens, refreshAccessToken } from '@/lib/google-oauth'

export async function GET() {
  try {
    let tokens = await getTokens()
    if (!tokens) return NextResponse.json(null)

    if (tokens.expiry_date && Date.now() > tokens.expiry_date * 1000) {
      const refreshed = await refreshAccessToken(tokens)
      if (!refreshed) return NextResponse.json(null)
      tokens = refreshed
    }

    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    const searchResult = await searchResponse.json()
    if (!searchResult.files || searchResult.files.length === 0) return NextResponse.json(null)

    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${searchResult.files[0].id}?alt=media`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (!downloadResponse.ok) return NextResponse.json(null)

    const data = await downloadResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Load from Drive error:', error)
    return NextResponse.json(null)
  }
}
