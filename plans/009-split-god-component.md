# Plan 009: Split God Component — page.tsx (1128 lines → 4 files)

## Finding
`src/app/page.tsx` is 1128 lines handling BOTH unauthenticated landing page AND authenticated dashboard in one file. Contains:
- `AddTransactionModal` component (inline, lines 35-247)
- Export/import utility functions (lines 249-460)
- Landing page JSX (lines ~505-800)
- Dashboard JSX (lines ~807-1128)

## Target structure
```
src/app/page.tsx           → ~30 lines, thin auth gate
src/components/LandingPage.tsx  → unauthenticated landing (hero + features + CTA + footer)
src/components/DashboardView.tsx → authenticated dashboard + export/import
src/components/AddTransactionModal.tsx → extracted modal
```

## Steps

### Step 1: Extract AddTransactionModal
Create `src/components/AddTransactionModal.tsx`:
- Move TxForm interface, emptyTxForm, and AddTransactionModal function from page.tsx
- Accept same props (open, onClose, onSave, initial)
- Import needed types and store

### Step 2: Extract LandingPage
Create `src/components/LandingPage.tsx`:
- Move the unauthenticated return block (everything between `if (!isAuthenticated) {` and the closing `}`)
- Keep all hero, features, CTA, footer sections
- Accept login function and isAuthenticated/loading as props

### Step 3: Extract DashboardView
Create `src/components/DashboardView.tsx`:
- Move the authenticated dashboard section
- Include: export/import functions, balance card, accounts, recurring, transactions, batch-assign bar
- Accept state/dispatch as props

### Step 4: Rewrite page.tsx
- Import LandingPage, DashboardView, AddTransactionModal
- Auth gate: if !isAuthenticated → render LandingPage, else → render DashboardView
- Keep loading state

## Verification
- `npm run build` exits 0
- App renders landing page when logged out
- App renders dashboard when logged in
- Add transaction modal works

## STOP conditions
- If framer-motion imports cause issues, keep the motion imports in both files
- If the IIFE for landing page is complex, extract carefully preserving all motion.div wrappers
