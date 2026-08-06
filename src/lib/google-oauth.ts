const FILE_NAME = 'finance-flash-data.json'
const MIME_TYPE = 'application/json'

export { FILE_NAME, MIME_TYPE }

// One year. Every successful refresh rewrites the cookie, so an account that
// gets opened even once a year stays signed in indefinitely.
export const SESSION_MAX_AGE = 365 * 24 * 60 * 60

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

export type RefreshResult =
  | { ok: true; tokens: Tokens }
  // `revoked` means Google told us the grant is gone — the user unlinked the
  // app, changed their password, or the refresh token expired. Anything else is
  // transient and must not end the session.
  | { ok: false; revoked: boolean }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function refreshAccessToken(tokens: Tokens): Promise<RefreshResult> {
  if (!tokens.refresh_token) return { ok: false, revoked: true }

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(300 * 2 ** (attempt - 1))

    let response: Response
    try {
      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
    } catch {
      continue // network blip — retry
    }

    if (response.ok) {
      const data = await response.json()
      return {
        ok: true,
        tokens: {
          ...tokens,
          access_token: data.access_token,
          // Google only returns a new refresh_token when it rotates one.
          refresh_token: data.refresh_token || tokens.refresh_token,
          expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
        },
      }
    }

    // Only invalid_grant is a real sign-out. 429/5xx are Google having a bad
    // moment and are worth retrying.
    if (response.status === 400 || response.status === 401) {
      const body = await response.text()
      if (body.includes('invalid_grant')) {
        console.error('Refresh token revoked by Google:', body)
        return { ok: false, revoked: true }
      }
    }
    console.warn(`Token refresh attempt ${attempt + 1} failed: ${response.status}`)
  }

  return { ok: false, revoked: false }
}

export async function saveTokens(tokens: Tokens) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.set('google_tokens', JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export interface ValidTokensResult {
  tokens: Tokens | null
  /** True only when the session is genuinely over and the user must sign in. */
  revoked: boolean
}

// Returns tokens plus whether a null result means "signed out" or "could not
// reach Google right now". Callers that decide auth state must check `revoked`,
// never just the null — a transient outage is not a logout.
export async function getValidTokensResult(): Promise<ValidTokensResult> {
  const tokens = await getTokens()
  if (!tokens) return { tokens: null, revoked: true }

  // Refresh if expired (5-min buffer to avoid edge-case races)
  const expiry = tokens.expiry_date ?? 0
  if (!expiry || Date.now() <= expiry - 5 * 60 * 1000) {
    return { tokens, revoked: false }
  }

  const result = await refreshAccessToken(tokens)
  if (result.ok) {
    await saveTokens(result.tokens)
    return { tokens: result.tokens, revoked: false }
  }
  if (result.revoked) return { tokens: null, revoked: true }

  // Transient failure: keep the session and hand back the stale token. The
  // caller's Google request will fail with 401 and surface as "temporarily
  // unavailable", which is recoverable — signing the user out is not.
  return { tokens, revoked: false }
}

export async function getValidTokens(): Promise<Tokens | null> {
  return (await getValidTokensResult()).tokens
}
