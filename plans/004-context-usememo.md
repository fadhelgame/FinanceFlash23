# Plan 004: Wrap Context Values with useMemo

## Finding
`store.tsx:248` creates a new context value object every render (`{ state, dispatch, saveToDrive, loadFromSource, saving, lastSaved }`), causing every consumer to re-render on any state change. Same issue in `auth-context.tsx:65` with `{ ...auth, login, logout }`.

## Files to modify
- `src/lib/store.tsx`
- `src/lib/auth-context.tsx`

## Steps

1. **store.tsx**: Wrap the context value in `useMemo`:
```tsx
const contextValue = useMemo(() => ({
  state, dispatch, saveToDrive, loadFromSource, saving, lastSaved,
}), [state, saveToDrive, loadFromSource, saving, lastSaved])
```

2. **auth-context.tsx**: Wrap in `useMemo`:
```tsx
const contextValue = useMemo(() => ({
  ...auth, login, logout,
}), [auth, login, logout])
```

3. Replace `value={{ ... }}` with `value={contextValue}` in both providers.

4. `npm run build` to verify.

## Verification
- `npm run build` exits 0
- React DevTools show no unnecessary re-renders on state changes

## STOP conditions
- If `saveToDrive` or `loadFromSource` identity changes on every render (they use `useCallback` so they shouldn't)
