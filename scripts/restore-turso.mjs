// Recovery tool. Restores a user's row either from a Drive revision export or
// from a snapshot the shrink guard archived into finance_cache_history.
//
//   npm run db:restore -- <email> <path-to-json>
//   npm run db:restore -- <email> --history <id>
//
// Both paths archive the current row first, so a restore is itself undoable.
import { readFileSync } from 'node:fs'
import { getClient, countEntries } from './turso-env.mjs'

const [email, source, historyId] = process.argv.slice(2)
if (!email || !source) {
  console.error('Usage: npm run db:restore -- <email> <path-to-json>')
  console.error('       npm run db:restore -- <email> --history <id>')
  process.exit(1)
}

const client = getClient()

await client.execute(
  `CREATE TABLE IF NOT EXISTS finance_cache_history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_email TEXT NOT NULL,
     data TEXT NOT NULL,
     entry_count INTEGER NOT NULL,
     archived_at TEXT NOT NULL,
     reason TEXT
   )`
)

let payload
if (source === '--history') {
  if (!historyId) {
    console.error('--history needs a snapshot id. Run `npm run db:check` to list them.')
    process.exit(1)
  }
  const rs = await client.execute({
    sql: 'SELECT data FROM finance_cache_history WHERE id = ? AND user_email = ?',
    args: [Number(historyId), email],
  })
  if (rs.rows.length === 0) {
    console.error(`No history snapshot #${historyId} for ${email}`)
    process.exit(1)
  }
  payload = JSON.parse(rs.rows[0].data)
} else {
  payload = JSON.parse(readFileSync(source, 'utf8'))
}

for (const key of ['accounts', 'transactions', 'recurringTransactions']) {
  if (!Array.isArray(payload[key])) {
    console.error(`Bad payload: ${key} is not an array`)
    process.exit(1)
  }
}

const count = countEntries(payload)
if (count === 0) {
  console.error('Refusing to restore an empty payload')
  process.exit(1)
}

const existing = await client.execute({
  sql: 'SELECT data FROM finance_cache WHERE user_email = ?',
  args: [email],
})
if (existing.rows.length > 0) {
  let existingCount = 0
  try {
    existingCount = countEntries(JSON.parse(existing.rows[0].data))
  } catch {
    // treat unparseable as empty
  }
  await client.execute({
    sql: `INSERT INTO finance_cache_history (user_email, data, entry_count, archived_at, reason)
          VALUES (?, ?, ?, datetime('now'), 'pre-restore snapshot')`,
    args: [email, existing.rows[0].data, existingCount],
  })
  console.log(`Archived current row (${existingCount} entries) to finance_cache_history`)
}

await client.execute({
  sql: `INSERT INTO finance_cache (user_email, data, updated_at) VALUES (?, ?, datetime('now'))
        ON CONFLICT(user_email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  args: [email, JSON.stringify(payload)],
})

console.log(
  `Restored ${email}: ${count} entries ` +
    `(a=${payload.accounts.length} t=${payload.transactions.length} r=${payload.recurringTransactions.length}) ` +
    `lastUpdated=${payload.lastUpdated}`
)
