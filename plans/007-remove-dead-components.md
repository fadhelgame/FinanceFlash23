# Plan 007: Remove Dead Components

## Finding
Two component files are imported by nobody in the codebase:
- `src/components/SparklesText.tsx` (116 lines) — animated sparkle effect
- `src/components/FlashText.tsx` (128 lines) — animated flash text

Both use `framer-motion` and add ~2KB to bundle with zero usage. They were likely replaced by `VerticalCutReveal` but never deleted.

## Files to delete
- `src/components/SparklesText.tsx`
- `src/components/FlashText.tsx`

## Steps
1. `rm src/components/SparklesText.tsx src/components/FlashText.tsx`
2. Verify no imports: `grep -rn "SparklesText\|FlashText" src/` should return nothing
3. `npm run build` — verify no compilation errors

## Verification
- `npm run build` exits 0
- App functions identically (no component references these files)
