# Plan 008: Debounce Drive Saves

## Finding
`src/lib/store.tsx:105-122` fires a Drive API save HTTP request on EVERY state change via `useEffect`. Adding 10 transactions rapidly (e.g. CSV import) = 10 sequential API calls. Google Drive API has quota limits (~1B requests/day for free tier, but rate-limited per 100/sec). No debounce means:

- Quota waste: if user types 3 characters in a title field, that's 3 saves
- Race conditions: rapid dispatches during CSV import cause save storms
- Unnecessary battery/bandwidth usage on mobile

## Fix
Add a 500ms debounce to the Drive save effect. Only the last state after the debounce window fires the save.

## Files to modify
- `src/lib/store.tsx` — add debounce to the save effect

## Steps
1. Add a debounce ref (`useRef<NodeJS.Timeout | null>(null)`)
2. In the save `useEffect`, instead of saving immediately:
   - Clear any existing debounce timer
   - Set a new timer with `setTimeout(() => save(), 500)`
3. Clean up the timer in the effect cleanup function
4. Keep the `beforeunload`/`visibilitychange` handler immediate (no debounce there — those are page-exit events)

## Verification
- `npm run build` exits 0
- Rapid state changes → only one Drive save fires after 500ms of inactivity

## STOP conditions
- The `beforeunload` save must not be debounced (page might close before timer fires)
- localStorage save should still be immediate for reliability
