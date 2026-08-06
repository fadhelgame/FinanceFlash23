// Shared bootstrap for the Turso maintenance scripts. Reads .env.local from the
// project root so the scripts work without a dev server running.
import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function readEnv() {
  const env = {}
  for (const line of readFileSync(join(projectRoot, '.env.local'), 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

export function getClient() {
  const env = readEnv()
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN missing from .env.local')
  }
  return createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
}

export function countEntries(data) {
  if (!data || typeof data !== 'object') return 0
  const len = key => (Array.isArray(data[key]) ? data[key].length : 0)
  return len('accounts') + len('transactions') + len('recurringTransactions')
}
