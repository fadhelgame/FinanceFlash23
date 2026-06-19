# Audit Report: Finance Flash Web App

**Date:** 2026-06-19
**Scope:** Full-stack audit (Next.js 16, React 19, Turso, Google Drive, localStorage)
**Files examined:** ~30 source files covering auth, state management, API routes, UI components, CSS, and config

---

## Summary

6 critical (P0), 8 high (P1), 11 medium (P2), 3 low (P3) findings. The app has solid architecture and clean code, but contains several bugs that break core functionality — most notably the Turso save path is completely dead due to an httpOnly cookie mismatch, and the mobile carousel navigation is broken due to a CSS selector syntax error.

---

## BUGS & CORRECTNESS

### P0 — Turso save permanently broken: httpOnly cookie invisible to client JS

**File:** `src/lib/store.tsx` line 121 · `src/app/api/auth/callback/route.ts` line 67

**Description:** The `google_email` cookie is set with `httpOnly: true` in the OAuth callback route, but `store.tsx` reads it via `document.cookie.match(/google_email=([^;]+)/)`. httpOnly cookies are **inaccessible** from `document.cookie` by design — this always returns `null`. The `decodeURIComponent(undefined)` call produces the string `"undefined"`, causing every Turso save to write under the literal key `"undefined"` instead of the user's email. This means:
- Turso saves silently write to a junk key
- Turso loads (via `/api/turso/load?email=real@email`) never find data
- The entire Turso cache layer is non-functional

**Fix:** Either (a) remove `httpOnly: true` from the `google_email` cookie (line 67 of callback/route.ts), or (b) expose the email via a different mechanism (e.g., `/api/auth/status` response, which already returns it). Option (a) is simplest — the email is not sensitive enough to warrant httpOnly.

**Impact:** ALL authenticated users. Every state change fires a Turso save that writes to `"undefined"`. The Turso cache is completely dead.

---

### P0 — Mobile carousel prev/next buttons use broken CSS selector

**File:** `src/components/LandingPage.tsx` lines 346, 371

**Description:** The custom prev/next buttons dispatch `KeyboardEvent` to the carousel by querying `document.querySelector('[data-slot=\\"carousel\\"]')`. The `\\"` inside the template literal produces a literal `\"` in the selector string, i.e. `[data-slot=\"carousel\"]`. This is **not** a valid CSS attribute selector — the backslash before `"` makes it look for a literal backslash character. The correct selector should be `[data-slot="carousel"]` (no backslash). On mobile, tapping prev/next does nothing.

**Fix:** Use the carousel context API instead of DOM querying. The `Carousel` component exports `scrollPrev`/`scrollNext` via context. Wrap the mobile arrow buttons in a sub-component that calls `useCarousel()` and uses those methods directly.

**Impact:** All mobile users (sm breakpoint). The carousel feature navigation buttons are completely non-functional on phones.

---

### P1 — `processRecurring.setMonth()` edge case: day overflow on short months

**File:** `src/lib/types.ts` line 175

**Description:** `nextDue.setMonth(nextDue.getMonth() + 1)` is used to advance the next due date by one month. JavaScript's `Date.setMonth()` handles day overflow by rolling into the next month. Example: if `nextDue` is January 31, `setMonth(1)` (February) produces March 3 (or March 2 in non-leap years) because February has only 28-29 days. This silently skips February. Any recurring transaction with `dayOfMonth >= 29` triggers this bug on short months.

**Fix:** After `setMonth()`, clamp the day to the last valid day of the target month:
```ts
const targetMonth = nextDue.getMonth() + 1;
nextDue.setMonth(targetMonth);
if (nextDue.getDate() !== dayOfMonth) {
  nextDue.setDate(0); // roll back to last day of previous month
}
```

**Impact:** Users with recurring transactions set to the 29th, 30th, or 31st of the month. Every month boundary on short months advances incorrectly, potentially causing duplicate or missed auto-generation.

---

### P1 — CSV/JSON import parse error: `AccountType` cast bypasses type safety

**File:** `src/components/DashboardView.tsx` line 140

**Description:** `category: (vals[catIdx] as any) || 'Other'` casts the CSV category value to `any` before assigning to the typed `TransactionCategory` field. A malformed CSV with an unknown category (e.g., "Groceries" instead of "Shopping") would store a string that doesn't match the union type. Downstream code that uses `CATEGORY_COLORS[tx.category]` would return `undefined`, and `CatIcon` would hit the `default` case. More critically, the `ACCOUNT_TYPE_COLORS` map in `AcctIcon` could return `undefined` for unknown account types.

**Fix:** Validate against known categories/account types. Reject or map to a safe default (`'Other'` for categories, `'Cash'` for accounts):
```ts
const category: TransactionCategory = CATEGORIES.includes(vals[catIdx] as any)
  ? (vals[catIdx] as TransactionCategory)
  : 'Other';
```

**Impact:** Users importing CSVs with non-standard category names get silent data corruption — expenses filed under `undefined` category display without an icon and with a broken color.

---

### P1 — `useState` side-effect sync pattern in AddTransactionModal is broken

**File:** `src/components/AddTransactionModal.tsx` line 49

**Description:** `useState(() => { setShow(open) })` creates an **unused** state variable (destructured nowhere) while calling `setShow` as a side effect inside the initializer. The initializer runs **only once** on first mount. On subsequent opens (e.g., editing a second transaction), `show` is never re-synced. The component happens to work because `if (!open) return null` on line 51 bypasses `show` entirely. This is dead code with a side-effect that should never be inside a state initializer.

**Fix:** Remove line 49 (`useState(() => { setShow(open) })`) and the unused `show` state (line 47). The `open` prop already controls visibility.

**Impact:** None currently (dead code), but violates React rules of hooks and could cause subtle bugs if the component is refactored.

---

### P1 — Double localStorage write on every state change

**File:** `src/lib/store.tsx` lines 104-108 and 112-132

**Description:** Two `useEffect` blocks both depend on `[state]`. The first (line 104) writes to localStorage. The second (line 112) ALSO writes to localStorage (line 117) in the same effect cycle. Every dispatch triggers two synchronous `localStorage.setItem()` calls, doubling the main-thread blocking time.

**Fix:** Remove the redundant `localStorage.setItem()` call in the Turso effect (line 117). The localStorage persistence is already handled by the first effect.

**Impact:** All users — 2x unnecessary localStorage I/O on every keystroke or transaction add. Adds up with large datasets.

---

## SECURITY

### P0 — Live OAuth secrets in `.env.local` on disk

**File:** `.env.local` (lines 1-7)

**Description:** The `.env.local` file contains live, unredacted production secrets:
- `GOOGLE_CLIENT_ID=811072216906-...apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET=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`
- `TURSO_AUTH_TOKEN=eyJhbG...7EDw`

While `.env.local` is in `.gitignore` (line 42), these secrets exist in plaintext on the filesystem and could be leaked through:
- A development server that serves static files
- Source map exposure in production builds
- Accidental `cat` / copy-paste in screenshots
- Backup software that backs up the entire directory

Additionally, the `.env.local` has a malformed line: `NEXTAUTH_SECRET=...\n# Turso Database` — the `\n` is a literal backslash-n, not a newline, making line 5 a single broken line.

**Fix:** (1) Rotate all secrets immediately (revoke the OAuth client credentials and Turso token). (2) Use a secrets manager (Vercel Environment Variables, Doppler, 1Password CLI) instead of disk files. (3) For local dev, use `.env.local` but ensure it's never printed or backed up. (4) Fix the malformed line — remove the `\n` between `NEXTAUTH_SECRET` and `# Turso Database`.

**Impact:** If leaked, an attacker could access (a) the Google OAuth consent screen, (b) the Turso database containing all user finance data. **High severity.**

---

### P1 — `/api/turso/save` and `/api/turso/load` have no authentication

**File:** `src/app/api/turso/save/route.ts` lines 4-16 · `src/app/api/turso/load/route.ts` lines 4-16

**Description:** Both Turso API endpoints accept an `email` parameter in the request body/query and perform database operations without verifying the caller's identity. The server does not check any auth cookie, token, or CSRF header. Any script on the same origin (or any site if CORS is misconfigured) could POST arbitrary data under any email address, or bulk-read user data via the load endpoint.

The Google Drive endpoints (`/api/google-drive/save`, `/api/google-drive/load`) do verify cookies (`getTokens()`) — inconsistent security posture.

**Fix:** Add the same cookie-based auth check used in the Drive endpoints. Verify `google_tokens` cookie exists and the email in the request matches the email from the cookie:
```ts
const { cookies } = await import('next/headers')
const cookieStore = await cookies()
const emailCookie = cookieStore.get('google_email')
if (!emailCookie || emailCookie.value !== email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Impact:** Anyone who can send HTTP requests to these endpoints can read/write any user's Turso cache data.

---

### P1 — `NEXTAUTH_SECRET` in env is unused (stale config)

**File:** `.env.local` line 4

**Description:** `NEXTAUTH_SECRET` is an environment variable for NextAuth.js (v4/v5). This project implements **custom OAuth** via raw Google APIs. The secret is never referenced anywhere in the codebase. It's a leftover from a previous auth implementation. Keeping it in the environment adds unnecessary attack surface and confusion.

**Fix:** Remove `NEXTAUTH_SECRET` from all `.env.*` files.

**Impact:** None directly (unused), but violates the principle of least exposure.

---

### P2 — No CSRF protection on any API endpoint

**Files:** All API routes under `src/app/api/`

**Description:** None of the POST endpoints (auth/callback, turso/save, google-drive/save, auth/logout) implement CSRF tokens or validate `Origin`/`Referer` headers. The OAuth callback does validate the `state` parameter (line 15 of callback/route.ts), which is good anti-CSRF for the OAuth flow itself. But the data endpoints are unprotected against cross-site request forgery.

**Impact:** Theoretical — needs same-origin execution to exploit. Low priority given Next.js's built-in CSRF protections (SameSite cookies).

---

### P2 — `@libsql/client` imported in client-side bundle (server-only dep on client)

**File:** `src/lib/turso.ts` lines 1-6 · imported via `src/lib/store.tsx` line 120

**Description:** `src/lib/turso.ts` is dynamically imported from client code (`store.tsx` line 120: `import('./turso')`). This module immediately creates a Turso client at import time using `process.env` variables that are **undefined on the client**. The Turso client module is then **never actually used** — only the `fetch()` to the `/api/turso/save` endpoint runs. This means:
- `@libsql/client` is bundled into the client-side JS (~hundreds of KB)
- The module's `createClient()` call runs on the client with empty env vars
- The dynamic import fetches and evaluates code that's never used

**Fix:** Remove the `import('./turso')` entirely from `store.tsx`. Just call `fetch('/api/turso/save', ...)` directly. The server endpoint handles the Turso database call.

**Impact:** 100% of users — unnecessary bundle bloat. Moderately large package in the client bundle.

---

## PERFORMANCE

### P2 — `framer-motion` bundle is 150KB+ for minimal animation use

**File:** `package.json` framer-motion `^12.40.0`

**Description:** `framer-motion` is ~150KB gzipped. It's used for entrance animations on the landing page (fade-up, stagger, spring) and a few `whileHover`/`whileTap` interactions. These could all be achieved with CSS animations or a lighter library like `motion` (the 10KB standalone variant of framer-motion).

**Impact:** ~30% of total JS bundle. Slows initial page load, especially on mobile.

---

### P2 — Every dispatch triggers two effects (Turso + localStorage) and one render rerun

**File:** `src/lib/store.tsx` lines 104-132

**Description:** The `[state]` dependency on both effects means every dispatch causes:
1. Re-render
2. Effect 1: localStorage write
3. Effect 2: localStorage write (duplicate) + Turso fetch + setLastSaved

For a bulk operation like CSV import (10+ dispatches in a loop), this means 10+ sequential re-renders, 20+ localStorage writes, and 10+ fetch calls to Turso.

**Fix for CSV import loop (DashboardView.tsx line 154):** Instead of dispatching one `ADD_TRANSACTION` per row, use a single batched dispatch (`ADD_MULTIPLE_TRANSACTIONS`). The action type already exists at line 25 of store.tsx — it's just not used in the import path.

---

### P2 — `prefers-reduced-motion` media query uses `important!` but still allows 140ms transitions

**File:** `src/app/globals.css` lines 295-302

**Description:** The reduced-motion override respects `prefers-reduced-motion: reduce` by shrinking animation durations to `0.01ms` (effectively disabling them). However, `transition-duration` is set to `140ms` instead of `0.01ms`, meaning transitions still play. This is contradictory — users requesting reduced motion still see 140ms transitions.

**Fix:** Set `transition-duration: 0.01ms !important` to match the animation behavior:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## DX & UX

### P2 — No error feedback for failed saves (silent `.catch(() => {})`)

**File:** `src/lib/store.tsx` lines 127, 163, 189, 219, 253

**Description:** Multiple catch blocks swallow errors silently with `.catch(() => {})`. Users have no indication when:
- Turso save fails (line 127)
- Drive save on tab close fails (line 163)
- localStorage read fails during load (line 199)
- Drive load fails (line 189)
- Any import error (lines 159, 166 in DashboardView.tsx)

**Fix:** Surface errors via a lightweight toast/notification system. At minimum, log to console with context (e.g., `console.error('Turso save failed:', err)` instead of empty catch).

---

### P2 — No loading skeleton or progress indicator for data load

**File:** `src/lib/store.tsx` lines 181-237 · `src/app/page.tsx` lines 37-43

**Description:** The landing page shows a minimal `animate-pulse` "Loading..." text during auth check, but once authenticated there's no load state for the actual finance data fetch (Drive + localStorage read in `loadFromSource`). If Drive is slow (slow API response), users see an empty dashboard. The `loaded` flag exists in state but isn't rendered.

**Fix:** Add a `<div className="skeleton">` state in `DashboardView` when `state.loaded === false` and the user is authenticated.

---

### P2 — Carousel prev/next bypasses Embla API via DOM hack (already noted under bugs)

**File:** `src/components/LandingPage.tsx` lines 345-378

**Description:** The mobile carousel arrows dispatch synthetic keyboard events to the DOM element rather than using the Embla API available via React context (the `Carousel` component provides `scrollPrev`/`scrollNext` via `useCarousel()`). This is fragile, breaks React's declarative model, and is the root cause of the P0 selector bug.

**Fix:** Extract the arrow buttons into a child component that calls `useCarousel()`:
```tsx
function CarouselNavArrows() {
  const { scrollPrev, scrollNext } = useCarousel();
  return (
    <>
      <button onClick={scrollPrev} aria-label="Previous slide">...</button>
      <button onClick={scrollNext} aria-label="Next slide">...</button>
    </>
  );
}
```

---

### P2 — `alert()` / `confirm()` dialogs block UI and are inconsistent on mobile

**File:** `src/components/DashboardView.tsx` lines 86, 90, 95, 112, 117, 153, 157

**Description:** Import/export and batch delete use `alert()` and `confirm()` native dialogs. These block the JavaScript event loop, provide no styling, and on iOS Safari are sometimes blocked or rendered as toast notifications. This pattern also breaks React's controlled-component model (the `dispatch` can fire before React re-renders).

**Fix:** Implement an inline confirmation modal or a toast-based notification system. For the import confirm flow, use a small React modal component.

---

### P3 — Export PDF opens a new window that may be blocked by popup blockers

**File:** `src/components/DashboardView.tsx` line 39

**Description:** `window.open('', '_blank')` is called synchronously inside a click handler but after some async state updates. Popup blockers (Chrome, Safari) often block `window.open` calls that don't happen directly in a user gesture handler. This would prevent the PDF export from working.

**Fix:** Store the window reference before async work, or use a direct `print()` approach without `window.open`.

---

### P3 — `line-clamp-2` truncates feature descriptions on mobile carousel

**File:** `src/components/LandingPage.tsx` line 323

**Description:** Feature descriptions use `line-clamp-2`, truncating descriptions to 2 lines. On small screens, some descriptions (like "Export CSV & PDF") are cut off with no way to expand. Users miss information.

**Fix:** Either shorten descriptions to fit 2 lines, or remove the clamp and let text flow naturally (the carousel cards have enough vertical space).

---

## DEPENDENCIES

### P1 — Dead client-side import: `@libsql/client` adds huge bundle weight

**File:** `src/lib/turso.ts` (imported at `src/lib/store.tsx` line 120)

**Description:** (Duplicated from Security section for completeness.) The `import('./turso')` in `store.tsx` is completely unnecessary — the only thing that happens after the import is a `fetch()` call to the API endpoint. The Turso module itself (including `@libsql/client`) is never called. This dependency should be **server-only** (it's only used in API routes), but the dynamic import pulls it into the client bundle.

**Fix:** Delete the dynamic import and just call `fetch()` directly.

---

### P2 — `clsx` and `tailwind-merge` are used but only through `cn()` utility

**File:** `package.json` · `src/lib/utils.ts`

**Description:** Both libraries are present and used correctly. No issue — this is the standard pattern.

---

### P2 — `embla-carousel-react` version `^8.6.0` may have breaking changes on minor update

**File:** `package.json` line 14

**Description:** The caret `^` allows minor version bumps (8.x). Embla Carousel has had several breaking changes in the 8.x line (API changes, type changes). A `npm update` or fresh install might pull a version with a changed API.

**Fix:** Pin to exact version (`8.6.0`) or test thoroughly after updates.

---

## DATA INTEGRITY

### P1 — Tab-close Drive save can fail silently, losing latest changes

**File:** `src/lib/store.tsx` lines 162-164

**Description:** On `beforeunload` / `visibilitychange('hidden')`, the app saves to Drive with `m.saveToDrive(data).catch(() => {})`. If the network is unavailable (user closed tab while offline), the save silently fails. The last successful Drive save may be minutes old. When the user re-opens the app, they'll see the older Drive data — their last edits are lost.

**Fix:** 
1. Remove the silent `.catch(() => {})` — log the error at minimum.
2. `localStorage.setItem()` is called at line 161 **before** the Drive save. On next load, `loadFromSource` prefers Drive over localStorage (line 204-208: "Drive wins always"). Change the merge strategy to **prefer the most recent timestamp** rather than unconditionally preferring Drive.

---

### P1 — Merge strategy is naive: Drive always wins, even if localStorage is newer

**File:** `src/lib/store.tsx` lines 203-214

**Description:** The comment says "localStorage is just a cache — Drive wins always". But `loadFromSource` fetches from Drive and localStorage **in parallel** (no synchronization). If:
1. User adds a transaction (saves to localStorage immediately via useEffect, line 107)
2. Drive sync hasn't run yet (it runs every 5 minutes, line 151)
3. User navigates away and comes back
4. `loadFromSource` loads from Drive (stale) → overwrites localStorage (fresh)

The result: the new transaction is lost because Drive data is older.

**Fix:** Compare `lastUpdated` timestamps and take the newer one:
```ts
const merged = driveData && localData
  ? new Date(driveData.lastUpdated) > new Date(localData.lastUpdated)
    ? driveData
    : localData
  : driveData || localData || emptyData;
```

---

### P2 — No data versioning or schema migration path

**File:** `src/lib/types.ts` lines 82-87

**Description:** `FinanceData` has no `version` field. If the schema changes (e.g., adding a `tags` field to transactions, changing `AccountType`), there's no way to detect or migrate old data. Users who haven't opened the app in months and then update will see errors or data loss.

**Fix:** Add a `version: number` field to `FinanceData`. On load, check the version and run migration functions if needed.

---

### P2 — localStorage quota exceeded not handled

**File:** `src/lib/store.tsx` lines 107, 117, 161, 219

**Description:** `localStorage.setItem()` throws a `QuotaExceededError` when storage is full (~5-10MB depending on browser). For a finance app with years of transactions, this limit can be hit. The try-catch at line 219 saves the Drive data to localStorage, but lines 107 and 117 have no error handling.

**Fix:** Wrap all `localStorage.setItem()` calls in try-catch blocks with user-visible error feedback.

---

### P3 — Demo mode leaves empty data in localStorage

**File:** `src/app/page.tsx` lines 30-35

**Description:** `handleExitDemo` calls `localStorage.removeItem('finance-flash-data')` after dispatching `SET_DATA` with empty data. But the state-change effect (line 104-108 of store.tsx) will re-write empty data to localStorage after the removal. The final state is localStorage with `{accounts:[], transactions:[], ...}` instead of nothing. On next auth'd load, this empty data may briefly flash before Drive data loads.

**Fix:** Remove localStorage in `handleExitDemo` before dispatching the empty state change, or skip the localStorage write when the data is demonstrably empty.

---

## ADDITIONAL FINDINGS

### P2 — `ForkKnife` lucide icon may have been renamed

**File:** `src/lib/ui-utils.tsx` line 5

**Description:** In newer versions of `lucide-react`, the `ForkKnife` icon was renamed to `Utensils`. The import `import { ..., ForkKnife, ... }` may produce a runtime error or tree-shaking warning depending on the installed version (`^1.20.0`). This should be verified against the actual installed version.

**Fix:** Check if `ForkKnife` exists in `node_modules/lucide-react`. If not, rename to `Utensils`.

---

### P3 — Hardcoded `id-ID` locale in formatIDR ignores browser locale

**File:** `src/lib/types.ts` line 128

**Description:** `formatIDR` always uses `"id-ID"` locale. For users with different browser locales, the number formatting (thousands separator, decimal) may be unexpected. Minor since the app is IDR-focused.

---

## SUMMARY TABLE

| Priority | Count | Categories |
|----------|-------|------------|
| **P0** | 2 | Turso broken (httpOnly cookie), Carousel broken (CSS selector) |
| **P1** | 7 | setMonth overflow, CSV validation, stale state in modal, double localStorage, env secrets, unauthenticated Turso endpoints, dead client import |
| **P2** | 11 | Bundle size, reduced-motion, error feedback, missing loading states, alert() usage, popup blockers, embla pinning, data merge strategy, no versioning, localStorage quota, ForkKnife icon |
| **P3** | 3 | line-clamp truncation, locale hardcode, demo cleanup |

## QUICKEST WINS (in priority order)

1. **Fix httpOnly cookie** (1 line change) — restores Turso cache functionality
2. **Fix carousel selector** (extract small sub-component) — restores mobile carousel navigation
3. **Remove dead `import('./turso')`** — saves hundreds of KB from client bundle
4. **Add auth check to Turso endpoints** (~10 lines) — closes security gap
5. **Fix setMonth overflow** (~5 lines) — prevents recurring transaction drift
6. **Fix data merge strategy** (~5 lines) — prevents data loss between Drive and localStorage
7. **Rotate exposed secrets** — revoke and regenerate all keys in .env.local
