# Plan 005: Deduplicate CatIcon, CATEGORY_COLORS, ACCOUNT_TYPE_COLORS, AcctIcon

## Finding
`src/lib/ui-utils.tsx` already exports canonical versions of `CATEGORY_COLORS`, `CatIcon`, `ACCOUNT_TYPE_COLORS`, and `AcctIcon`. But `src/app/recurring/page.tsx` and `src/app/accounts/[id]/page.tsx` still define their own duplicates. Also `src/app/accounts/page.tsx` has duplicate `AcctIcon` and `ACCOUNT_TYPE_COLORS`.

## Files to modify
- `src/app/recurring/page.tsx`
- `src/app/accounts/[id]/page.tsx`
- `src/app/accounts/page.tsx`

## Steps

For each of the 3 files:
1. Add import: `import { CATEGORY_COLORS, CatIcon, ACCOUNT_TYPE_COLORS, AcctIcon } from '@/lib/ui-utils'`
2. Delete the local duplicate definitions of `CATEGORY_COLORS`, `CatIcon`, `ACCOUNT_TYPE_COLORS`, `AcctIcon`
3. Remove unused lucide-react icon imports that were only used by the deleted functions (from all 3 files: `ForkKnife`, `Car`, `ShoppingBag`, `Gamepad2`, `FileText`, `Heart`, `Ellipsis`, `TrendingUp`, `Banknote`, `Wallet`, `ArrowLeftRight`, `CreditCard`, `Smartphone`, `Shield`)
4. `npm run build` to verify

## Verification
- `npm run build` exits 0
- No more duplicate `CATEGORY_COLORS` or `CatIcon` definitions in any file
- `grep -c "const CATEGORY_COLORS" src/app/*/page.tsx` returns 0 (only in ui-utils.tsx)

## STOP conditions
- If the import creates a circular dependency, import the specific functions directly
