import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

export async function saveToTurso(email: string, data: unknown): Promise<void> {
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

export async function deleteFromTurso(email: string): Promise<void> {
  await client.execute({
    sql: 'DELETE FROM finance_cache WHERE user_email = ?',
    args: [email],
  })
}
