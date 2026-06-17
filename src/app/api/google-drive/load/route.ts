import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FILE_NAME = 'finance-flash-data.json'

async function getTokens() {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('google_tokens')
  if (!tokenCookie) return null
  try {
    return JSON.parse(tokenCookie.value)
  } catch {
    return null
  }
}

async function refreshAccessToken(tokens: any) {
  if (!tokens.refresh_token) return null
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) return null
  const newTokens = await response.json()
  return { ...tokens, ...newTokens }
}

export async function GET() {
  try {
    let tokens = await getTokens()
    if (!tokens) {
      return NextResponse.json(null)
    }

    if (tokens.expiry_date && Date.now() > tokens.expiry_date * 1000) {
      const refreshed = await refreshAccessToken(tokens)
      if (!refreshed) {
        return NextResponse.json(null)
      }
      tokens = refreshed
    }

    // Find the file
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    const searchResult = await searchResponse.json()

    if (!searchResult.files || searchResult.files.length === 0) {
      return NextResponse.json(null)
    }

    const fileId = searchResult.files[0].id

    // Download content
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )

    if (!downloadResponse.ok) {
      return NextResponse.json(null)
    }

    const data = await downloadResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Load from Drive error:', error)
    return NextResponse.json(null)
  }
}
