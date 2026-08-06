'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, generateId, getActiveAccounts, getAccountLabel } from '@/lib/types'
import type { Transaction, TransactionCategory } from '@/lib/types'
import { CATEGORY_COLORS, CatIcon } from '@/lib/ui-utils'
import { CheckSquare, Square, ArrowLeft } from 'lucide-react'

interface ParsedTransaction {
  title: string
  amount: number
  category: TransactionCategory
  date: string
  isIncome: boolean
  accountId: string | null
}

const PLACEHOLDER = `Tulis catatan pengeluaranmu bebas, contoh:

kemarin makan siang 35rb pakai HB2
bensin 100k
tgl 3 bayar listrik 450.000
terima transfer gaji 8jt`

export default function NotesImportPanel({
  onAdd,
  onCancel,
}: {
  onAdd: (transactions: Transaction[]) => void
  onCancel: () => void
}) {
  const { state } = useFinanceStore()
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ParsedTransaction[] | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const handleParse = async () => {
    if (!text.trim() || parsing) return
    setParsing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          // Only active accounts — a settled loan should not collect new entries.
          accounts: getActiveAccounts(state.accounts).map(a => ({ id: a.id, name: a.name })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not read those notes.')
        return
      }
      setResults(data.transactions)
      setSkipped(data.skipped || 0)
      setSelected(new Set(data.transactions.map((_: ParsedTransaction, i: number) => i)))
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setParsing(false)
    }
  }

  const handleAdd = () => {
    if (!results) return
    const chosen = results.filter((_, i) => selected.has(i))
    if (chosen.length === 0) return
    const now = new Date().toISOString()
    onAdd(
      chosen.map(t => ({
        id: generateId(),
        title: t.title,
        amount: t.amount,
        category: t.category,
        date: t.date,
        isIncome: t.isIncome,
        accountId: t.accountId,
        createdAt: now,
      }))
    )
  }

  const toggle = (index: number) => {
    const next = new Set(selected)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelected(next)
  }

  if (!results) {
    return (
      <>
        <p className="text-xs mb-3" style={{ color: 'var(--color-ink-2)' }}>
          Write it however you like. You get to check the result before anything is added.
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          className="w-full rounded-xl px-4 py-3 outline-none text-sm resize-none"
          style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
        />
        {error && (
          <p className="text-xs mt-3" style={{ color: 'var(--color-warning)' }}>
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost flex-1 py-3">
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={!text.trim() || parsing}
            className="btn-primary flex-1 py-3"
            style={!text.trim() || parsing ? { opacity: 0.5 } : {}}
          >
            {parsing ? 'Reading…' : 'Read notes'}
          </button>
        </div>
      </>
    )
  }

  if (results.length === 0) {
    return (
      <>
        <p className="text-sm my-6 text-center" style={{ color: 'var(--color-ink-2)' }}>
          Nothing in those notes looked like a transaction.
        </p>
        <button onClick={() => setResults(null)} className="btn-primary w-full py-3">
          Edit notes
        </button>
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setResults(null)}
        className="flex items-center gap-1 text-xs mb-3"
        style={{ color: 'var(--color-ink-2)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to notes
      </button>
      <p className="text-xs mb-4" style={{ color: 'var(--color-ink-2)' }}>
        {results.length} found{skipped > 0 ? `, ${skipped} unreadable and dropped` : ''}. Untick anything wrong.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {results.map((t, i) => {
          const isSelected = selected.has(i)
          const color = CATEGORY_COLORS[t.category]
          const accountName = getAccountLabel(state.accounts, t.accountId)
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="card flex items-center gap-3 w-full text-left"
              style={{
                padding: 'var(--space-md)',
                opacity: isSelected ? 1 : 0.45,
                borderColor: isSelected ? 'var(--color-accent)' : undefined,
              }}
            >
              <div style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-ink-3)' }}>
                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${color}33` }}
              >
                <CatIcon category={t.category} className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="mono-label text-[10px]">{t.category}</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>
                    {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  {accountName && (
                    <span className="text-[10px]" style={{ color: 'var(--color-accent)' }}>
                      {accountName}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${t.isIncome ? 'text-income' : 'text-expense'}`}>
                {t.isIncome ? '+' : '-'}
                {formatIDR(t.amount)}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-ghost flex-1 py-3">
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={selected.size === 0}
          className="btn-primary flex-1 py-3"
          style={selected.size === 0 ? { opacity: 0.5 } : {}}
        >
          Add {selected.size}
        </button>
      </div>
    </>
  )
}
