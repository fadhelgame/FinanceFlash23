import { NextResponse } from 'next/server'
import { FILE_NAME, getValidTokens } from '@/lib/google-oauth'

export async function GET() {
  try {
    const tokens = await getValidTokens()
    if (!tokens) return NextResponse.json(null)

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
