# Plan 006: Fix Recurring Transaction Deduplication

## Finding
`src/lib/store.tsx` calls `processRecurring()` on every `loadFromSource`. This generates new transactions with `crypto.randomUUID()` for any recurring where `nextDueDate <= today`, WITHOUT checking if those transactions were already generated in a previous session.

If the Drive save fails (silently, due to the token expiry bug now fixed in plan 002) or is interrupted, the `nextDueDate` was never advanced, and the same recurring fires again on next load, creating duplicates.

## Root cause
`processRecurring` in `src/lib/types.ts:136-173` only checks `nextDueDate <= today`. It doesn't check if a transaction for this recurring period already exists. The function also runs `for...of` without any idempotency guard.

## Fix strategy
Add an **idempotency check**: before generating a new transaction from a recurring, check if a transaction with matching `title + amount + category + isIncome` already exists for the same month. If it does, skip generation.

## Files to modify
- `src/lib/types.ts` — modify `processRecurring` to accept existing transactions and check for duplicates

## Steps
1. In `processRecurring()`, for each active recurring that's due:
   - Check if any existing transaction matches: same `title`, `amount`, `category`, `isIncome`, and date within the same month/year as `nextDueDate`
   - If match found → skip (already generated)
   - If no match → generate new transaction and advance `nextDueDate` (current behavior)
2. `npm run build` to verify

## Verification
- `npm run build` exits 0
- Manual test: add a recurring, trigger loadFromSource twice → only ONE transaction generated

## STOP conditions
- User has legitimate duplicate transactions (e.g. same bill paid twice) → the check should be based on `nextDueDate` month, not just identical fields. Use monthly boundary check: `existingDate.getMonth() === nextDue.getMonth() && existingDate.getFullYear() === nextDue.getFullYear()`.
