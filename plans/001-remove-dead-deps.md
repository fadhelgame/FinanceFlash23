# Plan 001: Remove Dead Dependencies

## Finding
3 Google SDK packages (`googleapis`, `@googleapis/drive`, `google-auth-library`) are listed in `package.json` but never imported anywhere. All Google API calls use raw `fetch()` to REST endpoints. Total ~50MB of unused code.

## Steps

1. **Remove deps**: `npm uninstall googleapis @googleapis/drive google-auth-library`
2. **Verify no imports**: `grep -rn "from 'googleapis'\|from '@googleapis/drive'\|from 'google-auth-library'" src/` should return nothing
3. **Build**: `npm run build` must pass

## Verification
- `npm run build` exits 0
- `du -sh node_modules/googleapis` no longer exists
- App still loads and Drive sync works

## STOP conditions
- If any file imports these packages (contradicts the audit), stop and report
