// Health check: report every stored row and flag ones that look wiped.
// Usage: npm run db:check
import { getClient, countEntries } from './turso-env.mjs'

const client = getClient()

const rows = await client.execute(
  'SELECT user_email, data, updated_at FROM finance_cache ORDER BY updated_at DESC'
)

let wiped = 0
console.log(`\n${rows.rows.length} row(s) in finance_cache\n`)
for (const row of rows.rows) {
  let count = 0
  let breakdown = 'unparseable'
  try {
    const data = JSON.parse(row.data)
    count = countEntries(data)
    breakdown = `a=${data.accounts?.length ?? 0} t=${data.transactions?.length ?? 0} r=${data.recurringTransactions?.length ?? 0}`
  } catch {
    // leave defaults
  }
  const flag = count === 0 ? ' ⚠️  EMPTY' : ''
  if (count === 0) wiped++
  console.log(`  ${row.user_email.padEnd(32)} ${String(count).padStart(4)} entries  ${breakdown.padEnd(24)} ${row.updated_at}${flag}`)
}

// History only exists once a shrinking write has been archived.
let history = { rows: [] }
try {
  history = await client.execute(
    'SELECT id, user_email, entry_count, archived_at, reason FROM finance_cache_history ORDER BY id DESC LIMIT 20'
  )
} catch {
  console.log('\nNo finance_cache_history table yet — nothing has shrunk since the guard shipped.')
}

if (history.rows.length > 0) {
  console.log(`\nLast ${history.rows.length} archived snapshot(s):`)
  for (const row of history.rows) {
    console.log(`  #${String(row.id).padEnd(4)} ${row.user_email.padEnd(32)} ${String(row.entry_count).padStart(4)} entries  ${row.archived_at}  ${row.reason}`)
  }
  console.log('\nRestore one with: npm run db:restore -- <email> --history <id>')
}

if (wiped > 0) {
  console.log(`\n⚠️  ${wiped} row(s) hold no data. If that is unexpected, check Drive version history.`)
  process.exit(1)
}
console.log('\n✓ No empty rows.')
