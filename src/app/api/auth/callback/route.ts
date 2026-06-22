import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'

export async function GET(request: NextRequest) {
  try {
    const state = request.nextUrl.searchParams.get('state')
    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value
    cookieStore.delete('oauth_state')

    if (!state || !savedState || state !== savedState) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local' },
        { status: 500 }
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 })
    }

    // Normalize: Google returns expires_in (seconds), we store expiry_date (timestamp ms)
    const normalizedTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
      scope: tokens.scope,
      token_type: tokens.token_type,
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${normalizedTokens.access_token}` },
    })
    const user = await userResponse.json()

    const response = NextResponse.redirect(new URL('/', request.url))

    response.cookies.set('google_tokens', JSON.stringify(normalizedTokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    response.cookies.set('google_email', user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
