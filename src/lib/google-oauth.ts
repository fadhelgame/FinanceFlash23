const FILE_NAME = 'finance-flash-data.json'
const MIME_TYPE = 'application/json'

export { FILE_NAME, MIME_TYPE }

export async function getTokens() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('google_tokens')
  if (!tokenCookie) return null
  try {
    return JSON.parse(tokenCookie.value)
  } catch {
    return null
  }
}

export interface Tokens {
  access_token?: string
  refresh_token?: string
  expiry_date?: number
}

export async function refreshAccessToken(tokens: Tokens) {
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

  const data = await response.json()
  return {
    ...tokens,
    access_token: data.access_token,
    expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
  }
}

export async function saveTokens(tokens: Tokens) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.set('google_tokens', JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  })
}

// Shared: get tokens from cookie, auto-refresh if expired, save refreshed tokens back.
// Returns null if not authenticated or refresh fails.
export async function getValidTokens(): Promise<Tokens | null> {
  let tokens = await getTokens()
  if (!tokens) return null

  // Refresh if expired (5-min buffer to avoid edge-case races)
  const now = Date.now()
  const expiry = tokens.expiry_date ?? 0
  if (expiry && now > expiry - 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(tokens)
    if (!refreshed) return null
    tokens = refreshed
    await saveTokens(tokens) // persist refreshed tokens back to cookie
  }

  return tokens
}
