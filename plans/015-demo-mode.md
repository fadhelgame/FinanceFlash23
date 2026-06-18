# 015 — Demo Mode for Finance Flash

## Goal
Allow users to click "Try Demo" on the landing page and see the dashboard populated with realistic dummy data, without signing in. No Drive sync in demo mode. Resets on page refresh (no cookies/localStorage).

## Files to modify / create

### 1. `src/lib/demo-data.ts` (NEW)
Static arrays of `Account[]`, `Transaction[]`, `RecurringTransaction[]` with Indonesian data:
- 4 accounts: Kas (Cash), BCA (Bank), GoPay (E-Wallet), Mandiri Kartu Kredit (Credit Card)
- 12 transactions spread across accounts (food, transport, bills, salary, etc.)
- 2 recurring: Gaji Bulanan (salary, income) and Netflix (subscription, expense)

### 2. `src/lib/store.tsx` (MODIFY)
- Add `isDemoMode` boolean to context
- Add `setDemoMode` function to context
- When `isDemoMode` is true: skip Drive auto-save effects, skip Drive load
- Expose `setDemoMode` so `page.tsx` can toggle it

### 3. `src/app/page.tsx` (MODIFY)
- Add demo mode state with `useState`
- Import `demoData` from the new file
- Pass `onDemo` callback to `LandingPage`
- When in demo mode:
  - Dispatch SET_DATA with demoData
  - Call `setDemoMode(true)` on the store
  - Render `DashboardView` with `isDemoMode={true}`
  - Don't render AddTransactionModal (demo mode is view-only)

### 4. `src/components/LandingPage.tsx` (MODIFY)
- Accept optional `onDemo?: () => void` prop
- Change the "Learn more" button text/label to "Try Demo"
- Wire `onDemo` to the new button's onClick

### 5. `src/components/DashboardView.tsx` (MODIFY)
- Accept optional `isDemoMode?: boolean` prop
- When `isDemoMode` is true: render a small pill/badge at top saying "Demo Mode" with a "Sign in with Google →" button
- The badge is subtle, pastel-themed

## Design decisions
- No cookies/URL params — demo mode is in-memory React state only. Refresh = back to landing.
- Drive sync is completely blocked in demo mode via the `isDemoMode` flag in store
- Demo data uses realistic Indonesian amounts and categories
- Dashboard is otherwise fully functional (view only, no editing needed for demo)

## Build check
After changes, `npm run build` must pass cleanly.
