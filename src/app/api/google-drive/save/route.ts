import { NextRequest, NextResponse } from 'next/server'
import { FILE_NAME, MIME_TYPE, getValidTokens } from '@/lib/google-oauth'
import { countEntries } from '@/lib/types'

async function findFile(accessToken: string): Promise<string | null> {
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!searchResponse.ok) throw new Error(`Drive search failed: ${searchResponse.status}`)
  const searchResult = await searchResponse.json()
  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id
  }
  return null
}

async function createFile(accessToken: string): Promise<string> {
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FILE_NAME, mimeType: MIME_TYPE }),
  })
  if (!createResponse.ok) throw new Error(`Drive create failed: ${createResponse.status}`)
  const newFile = await createResponse.json()
  return newFile.id
}

async function readFile(accessToken: string, fileId: string): Promise<unknown | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokens = await getValidTokens()
    if (!tokens) return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })

    const { data, allowEmpty } = await request.json()
    const accessToken = tokens.access_token!
    let fileId = await findFile(accessToken)

    // Same guard as the Turso save route: never let an empty payload blank a
    // file that still holds data unless the client vouches for the deletion.
    if (fileId && countEntries(data) === 0 && !allowEmpty) {
      const existing = await readFile(accessToken, fileId)
      const existingCount = countEntries(existing)
      if (existingCount > 0) {
        console.error(
          `BLOCKED empty Drive overwrite: ${existingCount} entries would have been lost`
        )
        return NextResponse.json(
          { error: 'Refusing to overwrite existing data with an empty payload' },
          { status: 409 }
        )
      }
    }

    if (!fileId) fileId = await createFile(accessToken)

    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': MIME_TYPE },
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
