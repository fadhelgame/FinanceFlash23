'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { useAuth } from '@/lib/auth-context'
import { formatIDR, getTotalBalance, getTotalIncome, getTotalExpense, getAccountBalance, getActiveAccounts, getSettledAccounts, CATEGORIES, generateId } from '@/lib/types'
import type { Account, Transaction, RecurringTransaction, TransactionCategory, AccountType } from '@/lib/types'
import { CATEGORY_COLORS, CatIcon, ACCOUNT_TYPE_COLORS, AcctIcon } from '@/lib/ui-utils'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  FileText,
  CheckSquare,
  Square,
} from 'lucide-react'

/* ---------- Export helpers ---------- */

function exportCSV(transactions: Transaction[]) {
  const rows = [['Title', 'Amount', 'Category', 'Date', 'Type', 'Account ID']]
  for (const t of transactions) {
    rows.push([t.title, String(t.amount), t.category, t.date, t.isIncome ? 'Income' : 'Expense', t.accountId || ''])
  }
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-flash-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(transactions: Transaction[]) {
  // Simple printable view
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><title>Finance Flash Export</title>
    <style>
      body { font-family: Inter, sans-serif; background:#fff; color:#111; padding:40px; }
      h1 { font-size:24px; margin-bottom:8px; }
      .meta { color:#666; margin-bottom:24px; }
      table { width:100%; border-collapse:collapse; }
      th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #eee; font-size:14px; }
      th { background:#f5f5f5; font-weight:600; }
      .income { color:#16a34a; } .expense { color:#dc2626; }
    </style></head><body>
    <h1>Finance Flash</h1>
    <p class="meta">Exported ${new Date().toLocaleDateString()} — ${transactions.length} transactions</p>
    <table><thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>
    ${transactions.map(t => `<tr><td>${t.title}</td><td>${t.category}</td><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.isIncome ? 'Income' : 'Expense'}</td><td class="${t.isIncome ? 'income' : 'expense'}">${formatIDR(t.amount)}</td></tr>`).join('')}
    </tbody></table></body></html>
  `)
  win.document.close()
  win.print()
}

function exportJSON(state: { accounts: Account[]; transactions: Transaction[]; recurringTransactions: RecurringTransaction[] }) {
  const data = {
    accounts: state.accounts,
    transactions: state.transactions,
    recurringTransactions: state.recurringTransactions,
    lastUpdated: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-flash-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON(event: React.ChangeEvent<HTMLInputElement>, dispatch: React.Dispatch<any>) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (!data.accounts && !data.transactions && !data.recurringTransactions) {
        alert('Invalid backup file. Expected Finance Flash JSON backup.')
        return
      }
      const count = (data.accounts?.length || 0) + (data.transactions?.length || 0) + (data.recurringTransactions?.length || 0)
      if (confirm(`This will replace ALL current data with ${count} items from the backup.\n\nCurrent data will be lost. Continue?`)) {
        dispatch({ type: 'SET_DATA', payload: { ...data, lastUpdated: new Date().toISOString() } })
        alert(`Restored ${count} items successfully!`)
      }
    } catch {
      alert('Invalid JSON file. Please select a valid Finance Flash backup.')
    }
  }
  reader.readAsText(file)
  // Reset so the same file can be selected again
  event.target.value = ''
}

function importCSV(event: React.ChangeEvent<HTMLInputElement>, dispatch: React.Dispatch<any>) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        alert('CSV file must have a header row and at least one data row.')
        return
      }
      const header = lines[0].toLowerCase()
      if (!header.includes('title') || !header.includes('amount')) {
        alert('CSV must have at least Title and Amount columns.')
        return
      }

      const cols = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/"/g, ''))
      const titleIdx = cols.findIndex(c => c === 'title')
      const amountIdx = cols.findIndex(c => c === 'amount')
      const catIdx = cols.findIndex(c => c === 'category')
      const dateIdx = cols.findIndex(c => c === 'date')
      const typeIdx = cols.findIndex(c => c === 'type')
      const accountIdIdx = cols.findIndex(c => c === 'account id')

      const parsed: Transaction[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const amount = parseInt(vals[amountIdx]?.replace(/[^0-9-]/g, '') || '0', 10)
        if (!amount || isNaN(amount)) continue
                    const isIncome = vals[typeIdx]?.toLowerCase() === 'income'
        const accountId = accountIdIdx >= 0 ? (vals[accountIdIdx] || null) : null
        parsed.push({
          id: generateId(),
          title: vals[titleIdx] || 'Imported',
          amount: Math.abs(amount),
          category: (vals[catIdx] as any) || 'Other',
          date: vals[dateIdx] || new Date().toISOString().slice(0, 10),
          isIncome,
          accountId,
          createdAt: new Date().toISOString(),
        })
      }

      if (parsed.length === 0) {
        alert('No valid transactions found in the CSV.')
        return
      }

      if (confirm(`Add ${parsed.length} transaction${parsed.length > 1 ? 's' : ''} from CSV?`)) {
        for (const tx of parsed) {
          dispatch({ type: 'ADD_TRANSACTION', payload: tx })
        }
        alert(`Imported ${parsed.length} transaction${parsed.length > 1 ? 's' : ''}!`)
      }
    } catch {
      alert('Failed to parse CSV. Make sure it matches the export format.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

/* =====================================================
   DASHBOARD VIEW
   ===================================================== */

interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  loaded: boolean
}

export default function DashboardView({
  state,
  dispatch,
  userEmail,
  onEditTx,
  onAddTx,
  isDemoMode,
  onExitDemo,
}: {
  state: FinanceState
  dispatch: React.Dispatch<any>
  userEmail: string | null
  onEditTx: (tx: Transaction) => void
  onAddTx: () => void
  isDemoMode?: boolean
  onExitDemo?: () => void
}) {
  const [showExport, setShowExport] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
  const [assignAccountId, setAssignAccountId] = useState('')
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const accounts = getActiveAccounts(state.accounts)
  const transactions = state.transactions
  const recurring = state.recurringTransactions
  const { login } = useAuth()

  const totalBalance = useMemo(() => getTotalBalance(accounts, transactions), [accounts, transactions])
  const totalIncome = useMemo(() => getTotalIncome(transactions), [transactions])
  const totalExpense = useMemo(() => getTotalExpense(transactions), [transactions])
  const sortedTx = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  )
  const latestTx = sortedTx.slice(0, 10)

  const recurringIncome = useMemo(
    () => recurring.filter(r => r.isActive && r.isIncome).reduce((s, r) => s + r.amount, 0),
    [recurring]
  )
  const recurringExpense = useMemo(
    () => recurring.filter(r => r.isActive && !r.isIncome).reduce((s, r) => s + r.amount, 0),
    [recurring]
  )

  return (
    <div className="pb-24">
      <NavBar isDemoMode={isDemoMode} onExitDemo={onExitDemo} />

      <main className="section pt-20">
        {/* Export button */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="btn btn-ghost text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 card p-1 overflow-hidden" style={{ minWidth: '180px' }}>
                  <button
                    onClick={() => { exportPDF(transactions); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-paper-2)] rounded-lg transition-all" style={{ color: 'var(--color-ink-1)' }}
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <button
                    onClick={() => { exportCSV(transactions); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-paper-2)] rounded-lg transition-all" style={{ color: 'var(--color-ink-1)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                  <button
                    onClick={() => { exportJSON(state); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-paper-2)] rounded-lg transition-all" style={{ color: 'var(--color-ink-1)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Backup JSON
                  </button>
                  <div className="h-px my-1 mx-3" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 8%, transparent)' }} />
                  <button
                    onClick={() => { jsonInputRef.current?.click(); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-paper-2)] rounded-lg transition-all" style={{ color: 'var(--color-ink-1)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Restore JSON
                  </button>
                  <button
                    onClick={() => { csvInputRef.current?.click(); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-paper-2)] rounded-lg transition-all" style={{ color: 'var(--color-ink-1)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Import CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="balance-card mb-6">
          <p className="text-sm mb-1" style={{ opacity: 0.7 }}>Total Balance</p>
          <p className="text-3xl font-bold"><span className="italic-accent">{formatIDR(totalBalance)}</span></p>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--color-success) 15%, transparent)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              </div>
              <span className="mono-label">Income</span>
            </div>
            <p className="text-lg font-bold text-income">{formatIDR(totalIncome)}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--color-warning) 15%, transparent)' }}>
                <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              </div>
              <span className="mono-label">Expense</span>
            </div>
            <p className="text-lg font-bold text-expense">{formatIDR(totalExpense)}</p>
          </div>
        </div>

        {/* Accounts Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Accounts</h2>
            <Link
              href="/accounts"
              className="btn btn-ghost text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" /> Add
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No accounts yet. Tap + to add one.</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {accounts.map(acc => {
                const balance = getAccountBalance(acc, transactions)
                const color = ACCOUNT_TYPE_COLORS[acc.type]
                return (
                  <Link
                    key={acc.id}
                    href={`/accounts/${acc.id}`}
                    className="shrink-0 w-44 card hover:scale-[1.02] transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{ background: `${color}1F` }}
                    >
                      <AcctIcon type={acc.type} className="w-5 h-5" style={{ color }} />
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{acc.name}</p>
                    <p className="mono-label mb-2">{acc.type}</p>
                    <p className="text-base font-bold" style={{ color: 'var(--color-ink-0)' }}>{formatIDR(balance)}</p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Settled Loans */}
        {(() => {
          const settled = getSettledAccounts(state.accounts)
          if (settled.length === 0) return null
          return (
            <div className="mt-4 mb-8">
              <Link href="/accounts" className="text-xs mono-label flex items-center gap-1" style={{ color: 'var(--color-ink-2)' }}>
                {settled.length} settled loan{settled.length > 1 ? 's' : ''} · View history <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )
        })()}

        {/* Recurring Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Recurring</h2>
            <Link
              href="/recurring"
              className="btn btn-ghost text-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" /> Add
            </Link>
          </div>
          <Link href="/recurring" className="block card hover:scale-[1.01] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-accent-soft)' }} />
                <span className="mono-label">Monthly recurring</span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-ink-3)' }} />
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-income">+{formatIDR(recurringIncome)}</span>
              <span className="text-expense">-{formatIDR(recurringExpense)}</span>
            </div>
            {recurring.filter(r => r.isActive).slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: 'var(--rule-hair)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[r.category]}33` }}>
                    <CatIcon category={r.category} className="w-3 h-3" />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-ink-1)' }}>{r.title}</span>
                </div>
                <span className={`text-xs font-medium ${r.isIncome ? 'text-income' : 'text-expense'}`}>
                  {formatIDR(r.amount)}
                </span>
              </div>
            ))}
            {recurring.filter(r => r.isActive).length === 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--color-ink-3)' }}>No recurring transactions set up</p>
            )}
          </Link>
        </section>

        {/* Transactions Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Transactions</h2>
            <div className="flex items-center gap-2">
              {selectMode ? (
                <button
                  onClick={() => { setSelectMode(false); setSelectedTxIds(new Set()) }}
                  className="btn btn-ghost text-sm px-3 py-1.5"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  className="btn btn-ghost text-sm px-3 py-1.5"
                >
                  Manage
                </button>
              )}
              <Link href="/transactions" className="btn btn-ghost text-sm px-4 py-2">
                See all
              </Link>
            </div>
          </div>
          {latestTx.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No transactions yet. Tap + to add one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestTx.map(tx => {
                const isSelected = selectedTxIds.has(tx.id)
                const accountName = accounts.find(a => a.id === tx.accountId)?.name
                return selectMode ? (
                  <button
                    key={tx.id}
                    onClick={() => {
                      const next = new Set(selectedTxIds)
                      if (isSelected) next.delete(tx.id)
                      else next.add(tx.id)
                      setSelectedTxIds(next)
                    }}
                    className="w-full card flex items-center gap-3 hover:scale-[1.01] transition-all text-left"
                    style={{ padding: 'var(--space-md)', borderColor: isSelected ? 'var(--color-accent)' : undefined, borderWidth: isSelected ? '1.5px' : undefined }}
                  >
                    <div style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-ink-3)' }}>
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${CATEGORY_COLORS[tx.category]}33` }}
                    >
                      <CatIcon category={tx.category} className="w-5 h-5" style={{ color: CATEGORY_COLORS[tx.category] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{tx.title}</p>
                      <p className="mono-label text-[10px]">
                        {tx.category} &middot; {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {accountName ? <>&middot; {accountName}</> : <>&middot; <span style={{ color: 'var(--color-warning)' }}>No account</span></>}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                      {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                    </span>
                  </button>
                ) : (
                  <button
                    key={tx.id}
                    onClick={() => onEditTx(tx)}
                    className="w-full card flex items-center gap-3 hover:scale-[1.01] transition-all text-left"
                    style={{ padding: 'var(--space-md)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${CATEGORY_COLORS[tx.category]}33` }}
                    >
                      <CatIcon category={tx.category} className="w-5 h-5" style={{ color: CATEGORY_COLORS[tx.category] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{tx.title}</p>
                      <p className="mono-label text-[10px]">
                        {tx.category} &middot; {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {accountName ? <>&middot; {accountName}</> : <>&middot; <span style={{ color: 'var(--color-warning)' }}>No account</span></>}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                      {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Batch-assign bar */}
        {selectMode && selectedTxIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card flex items-center gap-3 px-5 py-3 shadow-lg" style={{ minWidth: '320px' }}>
            <span className="text-sm font-medium shrink-0" style={{ color: 'var(--color-ink-0)' }}>
              {selectedTxIds.size} selected
            </span>
            <select
              value={assignAccountId}
              onChange={e => setAssignAccountId(e.target.value)}
              className="flex-1 text-sm rounded-lg px-3 py-1.5"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)', border: '1px solid color-mix(in oklch, var(--color-ink-0) 12%, transparent)' }}
            >
              <option value="">— Pick account —</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!assignAccountId) { alert('Please select an account.'); return }
                const count = selectedTxIds.size
                selectedTxIds.forEach(id => {
                  const tx = transactions.find(t => t.id === id)
                  if (tx) {
                    dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...tx, accountId: assignAccountId } })
                  }
                })
                setSelectedTxIds(new Set())
                setAssignAccountId('')
                setSelectMode(false)
                alert(`Moved ${count} transaction${count > 1 ? 's' : ''} to ${accounts.find(a => a.id === assignAccountId)?.name || 'account'}.`)
              }}
              className="btn-primary text-sm px-4 py-1.5 shrink-0"
            >
              Assign
            </button>
          </div>
        )}
      </main>

      {/* Hidden file inputs */}
      <input ref={jsonInputRef} type="file" accept=".json" onChange={e => importJSON(e, dispatch)} className="hidden" />
      <input ref={csvInputRef} type="file" accept=".csv" onChange={e => importCSV(e, dispatch)} className="hidden" />

      {/* FAB */}
      <button onClick={onAddTx} className="fab">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
