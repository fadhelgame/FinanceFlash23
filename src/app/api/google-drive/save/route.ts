import { NextRequest, NextResponse } from 'next/server'
import { FILE_NAME, MIME_TYPE, getTokens, refreshAccessToken } from '@/lib/google-oauth'

async function findOrCreateFile(accessToken: string) {
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchResult = await searchResponse.json()
  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id
  }
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FILE_NAME, mimeType: MIME_TYPE }),
  })
  const newFile = await createResponse.json()
  return newFile.id
}

export async function POST(request: NextRequest) {
  try {
    let tokens = await getTokens()
    if (!tokens) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    if (tokens.expiry_date && Date.now() > tokens.expiry_date) {
      const refreshed = await refreshAccessToken(tokens)
      if (!refreshed) return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
      tokens = refreshed
    }

    const { data } = await request.json()
    const fileId = await findOrCreateFile(tokens.access_token!)
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': MIME_TYPE },
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
