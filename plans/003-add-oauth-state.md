# Plan 003: Add OAuth `state` Parameter (CSRF Protection)

## Finding
The OAuth authorization URL is generated without a `state` parameter, and the callback route does not verify one. This leaves the flow vulnerable to CSRF attacks.

## Files to modify
- `src/app/api/auth/google/route.ts` — generate and store `state` in cookie
- `src/app/api/auth/callback/route.ts` — verify `state` matches cookie

## Steps

1. **In `google/route.ts`**: Generate a random state value (`crypto.randomUUID()`), store it in an `httpOnly` cookie named `oauth_state`, and add `state` to the URLSearchParams.

2. **In `callback/route.ts`**: Read the `oauth_state` cookie and the `state` query param. Compare them. If mismatch, return 400. Delete the cookie afterward regardless.

## Implementation sketch

google/route.ts additions:
```typescript
import { cookies } from 'next/headers'

const state = crypto.randomUUID()
const cookieStore = await cookies()
cookieStore.set('oauth_state', state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 600, // 10 minutes
})
params.set('state', state)
```

callback/route.ts additions:
```typescript
const state = request.nextUrl.searchParams.get('state')
const cookieStore = await cookies()
const savedState = cookieStore.get('oauth_state')?.value
cookieStore.delete('oauth_state')

if (!state || !savedState || state !== savedState) {
  return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
}
```

## Verification
- Login flow works end-to-end
- A callback without matching `state` returns 400

## STOP conditions
- If `cookies()` requires `next/headers` dynamic import, use same pattern as `google-oauth.ts`
