import { createClient } from '@libsql/client'
import { countEntries } from './types'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

let historyTableReady: Promise<void> | null = null

function ensureHistoryTable(): Promise<void> {
  if (!historyTableReady) {
    historyTableReady = client
      .execute(
        `CREATE TABLE IF NOT EXISTS finance_cache_history (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           user_email TEXT NOT NULL,
           data TEXT NOT NULL,
           entry_count INTEGER NOT NULL,
           archived_at TEXT NOT NULL,
           reason TEXT
         )`
      )
      .then(() => {})
      .catch(err => {
        historyTableReady = null
        throw err
      })
  }
  return historyTableReady
}

export async function saveToTurso(email: string, data: unknown): Promise<void> {
  const incoming = countEntries(data)

  // Archive the previous row whenever the incoming payload holds fewer entries.
  // Shrinking is the only direction that can destroy data, so this is cheap and
  // makes every destructive write reversible.
  try {
    await ensureHistoryTable()
    const existing = await client.execute({
      sql: 'SELECT data FROM finance_cache WHERE user_email = ?',
      args: [email],
    })
    if (existing.rows.length > 0) {
      const previous = existing.rows[0].data as string
      let previousCount = 0
      try {
        previousCount = countEntries(JSON.parse(previous))
      } catch {
        previousCount = 0
      }
      if (previousCount > incoming) {
        await client.execute({
          sql: `INSERT INTO finance_cache_history (user_email, data, entry_count, archived_at, reason)
                VALUES (?, ?, ?, datetime('now'), ?)`,
          args: [email, previous, previousCount, `shrink ${previousCount} -> ${incoming}`],
        })
        console.warn(`Turso: archived ${email} before shrink ${previousCount} -> ${incoming}`)
      }
    }
  } catch (err) {
    // Archiving must never block a legitimate save.
    console.error('Turso history archive failed:', err)
  }

  await client.execute({
    sql: `INSERT INTO finance_cache (user_email, data, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [email, JSON.stringify(data)],
  })
}

export async function loadFromTurso<T>(email: string): Promise<T | null> {
  const rs = await client.execute({
    sql: 'SELECT data FROM finance_cache WHERE user_email = ?',
    args: [email],
  })
  if (rs.rows.length === 0) return null
  return JSON.parse(rs.rows[0].data as string) as T
}

export async function getAllFromTurso(): Promise<{ email: string; data: string }[]> {
  const rs = await client.execute('SELECT user_email, data FROM finance_cache')
  return rs.rows.map(r => ({
    email: r.user_email as string,
    data: r.data as string,
  }))
}

export async function listTursoHistory(
  email: string
): Promise<{ id: number; entryCount: number; archivedAt: string; reason: string }[]> {
  await ensureHistoryTable()
  const rs = await client.execute({
    sql: `SELECT id, entry_count, archived_at, reason FROM finance_cache_history
          WHERE user_email = ? ORDER BY id DESC`,
    args: [email],
  })
  return rs.rows.map(r => ({
    id: r.id as number,
    entryCount: r.entry_count as number,
    archivedAt: r.archived_at as string,
    reason: r.reason as string,
  }))
}

export async function restoreTursoHistory(email: string, historyId: number): Promise<number> {
  await ensureHistoryTable()
  const rs = await client.execute({
    sql: 'SELECT data, entry_count FROM finance_cache_history WHERE id = ? AND user_email = ?',
    args: [historyId, email],
  })
  if (rs.rows.length === 0) throw new Error(`No history entry ${historyId} for ${email}`)
  const data = rs.rows[0].data as string
  await client.execute({
    sql: `INSERT INTO finance_cache (user_email, data, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [email, data],
  })
  return rs.rows[0].entry_count as number
}

export async function deleteFromTurso(email: string): Promise<void> {
  await client.execute({
    sql: 'DELETE FROM finance_cache WHERE user_email = ?',
    args: [email],
  })
}
