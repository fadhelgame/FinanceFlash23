import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/types'
import type { TransactionCategory } from '@/lib/types'

// DeepSeek can take a while on a long note; the default function timeout is
// shorter than that.
export const maxDuration = 60

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MAX_INPUT_CHARS = 8000
const MAX_TRANSACTIONS = 100

export interface ParsedTransaction {
  title: string
  amount: number
  category: TransactionCategory
  date: string
  isIncome: boolean
  accountId: string | null
}

interface AccountRef {
  id: string
  name: string
}

function buildPrompt(accounts: AccountRef[], today: string): string {
  const accountList = accounts.length
    ? accounts.map(a => `- id "${a.id}" = ${a.name}`).join('\n')
    : '(the user has no accounts; always use null)'

  return `You extract financial transactions from a user's free-form notes and return json.

Today's date is ${today}. The currency is Indonesian Rupiah (IDR). Notes are usually written in Indonesian, sometimes mixed with English.

Return a json object of this exact shape:
{"transactions": [{"title": string, "amount": integer, "category": string, "date": "YYYY-MM-DD", "isIncome": boolean, "accountId": string or null}]}

Rules:
- amount is a positive integer in rupiah, with no separators. Expand Indonesian shorthand: "50rb"/"50k"/"50 ribu" = 50000, "2jt"/"2 juta" = 2000000, "1,5jt" = 1500000. "15.000" and "15,000" both mean 15000.
- category must be exactly one of: ${CATEGORIES.join(', ')}. Pick the closest fit; use "Other" when nothing fits.
- isIncome is true only for money coming in (salary, refunds, payments received). Default to false.
- date resolves relative wording against today's date: "kemarin" = yesterday, "senin lalu" = last Monday, "tgl 3" = the 3rd of the current month. When a note gives no date at all, use ${today}.
- accountId must be one of the ids below, or null when the note does not clearly name an account:
${accountList}
- title is a short human label in the user's own wording, without the amount.
- One entry per distinct transaction. Do not invent transactions that are not in the notes. If the notes contain nothing that looks like a transaction, return {"transactions": []}.`
}

function coerceTransaction(
  raw: unknown,
  accountIds: Set<string>,
  today: string
): ParsedTransaction | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const title = typeof r.title === 'string' ? r.title.trim().slice(0, 120) : ''
  if (!title) return null

  const amount =
    typeof r.amount === 'number'
      ? Math.round(r.amount)
      : parseInt(String(r.amount ?? '').replace(/\D/g, ''), 10)
  if (!Number.isFinite(amount) || amount <= 0) return null

  const category = CATEGORIES.includes(r.category as TransactionCategory)
    ? (r.category as TransactionCategory)
    : 'Other'

  const date =
    typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : today

  const accountId =
    typeof r.accountId === 'string' && accountIds.has(r.accountId) ? r.accountId : null

  return { title, amount, category, date, isIncome: r.isIncome === true, accountId }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DEEPSEEK_API_KEY is not configured on the server.' },
      { status: 501 }
    )
  }

  const cookieStore = await cookies()
  if (!cookieStore.get('google_email')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let text: string
  let accounts: AccountRef[]
  try {
    const body = await request.json()
    text = typeof body.text === 'string' ? body.text.trim() : ''
    accounts = Array.isArray(body.accounts)
      ? body.accounts
          .filter(
            (a: unknown): a is AccountRef =>
              !!a &&
              typeof (a as AccountRef).id === 'string' &&
              typeof (a as AccountRef).name === 'string'
          )
          .slice(0, 50)
      : []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text) {
    return NextResponse.json({ error: 'Notes are empty' }, { status: 400 })
  }
  if (text.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Notes are too long (${text.length} characters, limit ${MAX_INPUT_CHARS}).` },
      { status: 413 }
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  let response: Response
  try {
    response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: buildPrompt(accounts, today) },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    })
  } catch (error) {
    console.error('DeepSeek request failed:', error)
    return NextResponse.json({ error: 'Could not reach the AI service.' }, { status: 502 })
  }

  if (!response.ok) {
    const detail = await response.text()
    console.error('DeepSeek error:', response.status, detail)
    const message =
      response.status === 401
        ? 'The DeepSeek API key was rejected.'
        : response.status === 402
          ? 'The DeepSeek account has no credit left.'
          : response.status === 429
            ? 'Rate limited by DeepSeek. Try again in a moment.'
            : 'The AI service returned an error.'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  let parsed: unknown
  try {
    const completion = await response.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('No content in completion')
    parsed = JSON.parse(content)
  } catch (error) {
    console.error('DeepSeek returned unparseable output:', error)
    return NextResponse.json({ error: 'The AI returned an unreadable result.' }, { status: 502 })
  }

  const rawList = (parsed as { transactions?: unknown })?.transactions
  if (!Array.isArray(rawList)) {
    return NextResponse.json({ error: 'The AI returned an unexpected shape.' }, { status: 502 })
  }

  // Never trust the model's shape. Everything that reaches the client has been
  // coerced into a valid transaction or dropped.
  const accountIds = new Set(accounts.map(a => a.id))
  const transactions = rawList
    .slice(0, MAX_TRANSACTIONS)
    .map(raw => coerceTransaction(raw, accountIds, today))
    .filter((t): t is ParsedTransaction => t !== null)

  return NextResponse.json({ transactions, skipped: rawList.length - transactions.length })
}
