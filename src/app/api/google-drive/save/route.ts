import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FILE_NAME = 'finance-flash-data.json'
const MIME_TYPE = 'application/json'

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

async function findOrCreateFile(accessToken: string) {
  // Search for existing file
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const searchResult = await searchResponse.json()

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id
  }

  // Create new file
  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FILE_NAME,
        mimeType: MIME_TYPE,
      }),
    }
  )

  const newFile = await createResponse.json()
  return newFile.id
}

export async function POST(request: NextRequest) {
  try {
    let tokens = await getTokens()
    if (!tokens) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Refresh token if needed
    if (tokens.expiry_date && Date.now() > tokens.expiry_date * 1000) {
      const refreshed = await refreshAccessToken(tokens)
      if (!refreshed) {
        return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
      }
      tokens = refreshed
    }

    const { data } = await request.json()
    const fileId = await findOrCreateFile(tokens.access_token)

    // Upload content
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': MIME_TYPE,
        },
        body: JSON.stringify(data),
      }
    )

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text()
      console.error('Drive upload error:', err)
      return NextResponse.json({ error: 'Failed to save to Drive' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save to Drive error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
