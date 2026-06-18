# Plan 002: Fix Token Refresh Bug

## Finding
`google-oauth.ts:44` sets `expiry_date = Date.now() + (data.expires_in || 3600) * 1000` (already in milliseconds since epoch). But save/load routes check `Date.now() > tokens.expiry_date * 1000`, multiplying an already-ms value by 1000 → condition is NEVER true → token never refreshed → Drive API returns 401 after ~1 hour → silent sync failure.

Also, the initial token from the callback route stores Google's raw response which has `expires_in` (seconds) but no `expiry_date` field. The first check would see `expiry_date = undefined` and skip. Then `refreshAccessToken` creates `expiry_date` — but the `* 1000` makes it never expire.

## Files to modify
- `src/app/api/google-drive/save/route.ts:27` — remove `* 1000`
- `src/app/api/google-drive/load/route.ts:9` — remove `* 1000`

## Steps
1. In `save/route.ts`: change `tokens.expiry_date * 1000` to `tokens.expiry_date`
2. In `load/route.ts`: change `tokens.expiry_date * 1000` to `tokens.expiry_date`
3. `npm run build` to verify

## Verification
- `npm run build` exits 0
- After 1 hour of use, Drive sync still works (token refresh fires)

## STOP conditions
- If `expiry_date` is ever `undefined`, the check uses `undefined * 1000 = NaN` which is falsy ← current fallback behavior works correctly
