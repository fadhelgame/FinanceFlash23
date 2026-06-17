'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useFinanceStore } from '@/lib/store'
import {
  formatIDR,
  getTotalBalance,
  getTotalIncome,
  getTotalExpense,
  getAccountBalance,
  ACCOUNT_ICONS,
  ACCOUNT_TYPES,
  CATEGORIES,
  generateId,
} from '@/lib/types'
import type { Account, Transaction, TransactionCategory, AccountType } from '@/lib/types'

import {
  Banknote,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Smartphone,
  Shield,
  ForkKnife,
  Car,
  ShoppingBag,
  Gamepad2,
  FileText,
  Heart,
  Ellipsis,
  Plus,
  LogOut,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
  Clock,
} from 'lucide-react'

/* ---------- Icon/Color helpers ---------- */

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  Cash: '#22c55e',
  Bank: '#3b82f6',
  'Credit Card': '#f97316',
  Loan: '#ef4444',
  'E-Wallet': '#a855f7',
  Savings: '#14b8a6',
}

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Bills: '#ef4444',
  Salary: '#22c55e',
  Health: '#14b8a6',
  Other: '#6b7280',
}

function AcctIcon({ type, className, style }: { type: AccountType; className?: string; style?: React.CSSProperties }) {
  const iconName = ACCOUNT_ICONS[type]
  const props = { className: className || 'w-5 h-5', style: style || { color: '#fff' } }
  switch (iconName) {
    case 'banknote': return <Banknote {...props} />
    case 'building': return <Wallet {...props} />
    case 'credit-card': return <CreditCard {...props} />
    case 'arrow-left-right': return <ArrowLeftRight {...props} />
    case 'smartphone': return <Smartphone {...props} />
    case 'shield': return <Shield {...props} />
    default: return <Wallet {...props} />
  }
}

function CatIcon({ category, className, style }: { category: TransactionCategory; className?: string; style?: React.CSSProperties }) {
  const props = { className: className || 'w-5 h-5', style: style || {} }
  switch (category) {
    case 'Food': return <ForkKnife {...props} />
    case 'Transport': return <Car {...props} />
    case 'Shopping': return <ShoppingBag {...props} />
    case 'Entertainment': return <Gamepad2 {...props} />
    case 'Bills': return <FileText {...props} />
    case 'Salary': return <TrendingUp {...props} />
    case 'Health': return <Heart {...props} />
    default: return <Ellipsis {...props} />
  }
}

/* ---------- AddTransaction Modal ---------- */

interface TxForm {
  isIncome: boolean
  amount: string
  title: string
  accountId: string | null
  category: TransactionCategory
  date: string
}

const emptyTxForm = (): TxForm => ({
  isIncome: false,
  amount: '',
  title: '',
  accountId: null,
  category: 'Other',
  date: new Date().toISOString().slice(0, 10),
})

function AddTransactionModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (t: Transaction) => void
  initial?: Transaction | null
}) {
  const { state } = useFinanceStore()
  const [form, setForm] = useState<TxForm>(initial ? {
    isIncome: initial.isIncome,
    amount: String(initial.amount),
    title: initial.title,
    accountId: initial.accountId,
    category: initial.category,
    date: initial.date.slice(0, 10),
  } : emptyTxForm())
  const [show, setShow] = useState(open)

  useState(() => { setShow(open) })

  if (!open) return null

  const handleSave = () => {
    const amount = parseInt(form.amount.replace(/\D/g, ''), 10) || 0
    if (!form.title || amount <= 0) return
    onSave({
      id: initial?.id || generateId(),
      title: form.title,
      amount,
      category: form.category,
      date: form.date,
      isIncome: form.isIncome,
      accountId: form.accountId,
      createdAt: initial?.createdAt || new Date().toISOString(),
    })
    setForm(emptyTxForm())
    onClose()
  }

  const handleClose = () => {
    setForm(emptyTxForm())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-[#0a0a1a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Type toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          {(['Expense', 'Income'] as const).map((label) => (
            <button
              key={label}
              onClick={() => setForm(f => ({ ...f, isIncome: label === 'Income' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                (label === 'Expense' ? !form.isIncome : form.isIncome)
                  ? 'bg-blue-600 text-white'
                  : 'text-white/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-2xl font-bold text-white/50">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-white/20"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none placeholder-white/30"
          />
        </div>

        {/* Account chips */}
        <div className="mb-4">
          <label className="text-xs text-white/40 mb-2 block">Account</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setForm(f => ({ ...f, accountId: null }))}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                form.accountId === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              None
            </button>
            {state.accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setForm(f => ({ ...f, accountId: acc.id }))}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  form.accountId === acc.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <AcctIcon type={acc.type} className="w-3.5 h-3.5" />
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category grid */}
        <div className="mb-4">
          <label className="text-xs text-white/40 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat]
              const selected = form.category === cat
              return (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    selected ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: selected ? color : `${color}33` }}
                  >
                    <CatIcon category={cat} className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-[10px] ${selected ? 'text-white' : 'text-white/50'}`}>
                    {cat}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="text-xs text-white/40 mb-2 block">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all"
          >
            {initial ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Export / ---------- */

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

/* =====================================================
   MAIN PAGE
   ===================================================== */

export default function DashboardPage() {
  const { isAuthenticated, loading, userEmail, login, logout } = useAuth()
  const { state, dispatch } = useFinanceStore()
  const [showTxModal, setShowTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showExport, setShowExport] = useState(false)

  const accounts = state.accounts
  const transactions = state.transactions
  const recurring = state.recurringTransactions

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

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    )
  }

  // ---------- Unauthenticated landing ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] p-6">
        <div className="glass-card p-10 max-w-sm w-full text-center space-y-8">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-900/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Finance Flash</h1>
            <p className="text-white/50 text-sm">Track your personal finances in a flash</p>
          </div>
          <button
            onClick={login}
            className="w-full py-3 px-6 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200 border border-white/10 hover:border-white/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // ---------- Authenticated dashboard ----------

  const handleSaveTx = (tx: Transaction) => {
    if (editingTx) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: tx })
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })
    }
    setEditingTx(null)
    setShowTxModal(false)
  }

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx)
    setShowTxModal(true)
  }

  const openAddTx = () => {
    setEditingTx(null)
    setShowTxModal(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">Finance Flash</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 hidden sm:block">{userEmail}</span>
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 glass-card p-1 overflow-hidden">
                  <button
                    onClick={() => { exportPDF(transactions); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <FileText className="w-4 h-4" /> Export PDF
                  </button>
                  <button
                    onClick={() => { exportCSV(transactions); setShowExport(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="px-4 max-w-lg mx-auto space-y-5 mt-5">
        {/* Balance Card */}
        <div className="gradient-card rounded-2xl p-6 border border-white/5">
          <p className="text-sm text-white/50 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-white">{formatIDR(totalBalance)}</p>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-white/40">Income</span>
            </div>
            <p className="text-lg font-bold text-green-400">{formatIDR(totalIncome)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-white/40">Expense</span>
            </div>
            <p className="text-lg font-bold text-red-400">{formatIDR(totalExpense)}</p>
          </div>
        </div>

        {/* Accounts Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Accounts</h2>
            <Link
              href="/accounts"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-white/30 text-sm">No accounts yet. Tap + to add one.</p>
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
                    className="shrink-0 w-44 glass-card p-4 hover:bg-white/[0.08] transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{ background: `${color}1F` }}
                    >
                      <AcctIcon type={acc.type} className="w-5 h-5" style={{ color }} />
                    </div>
                    <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                    <p className="text-[10px] text-white/40 mb-2">{acc.type}</p>
                    <p className="text-base font-bold text-white">{formatIDR(balance)}</p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Recurring Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recurring</h2>
            <Link
              href="/recurring"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
          <Link href="/recurring" className="block glass-card p-4 hover:bg-white/[0.08] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/50">Monthly recurring</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">+{formatIDR(recurringIncome)}</span>
              <span className="text-red-400">-{formatIDR(recurringExpense)}</span>
            </div>
            {recurring.filter(r => r.isActive).slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[r.category]}33` }}>
                    <CatIcon category={r.category} className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-white/80">{r.title}</span>
                </div>
                <span className={`text-xs font-medium ${r.isIncome ? 'text-green-400' : 'text-red-400'}`}>
                  {formatIDR(r.amount)}
                </span>
              </div>
            ))}
            {recurring.filter(r => r.isActive).length === 0 && (
              <p className="text-white/30 text-xs mt-2">No recurring transactions set up</p>
            )}
          </Link>
        </section>

        {/* Transactions Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
            <Link href="/transactions" className="text-xs text-blue-400 hover:text-blue-300 transition-all">
              See all
            </Link>
          </div>
          {latestTx.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-white/30 text-sm">No transactions yet. Tap + to add one.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {latestTx.map(tx => (
                <button
                  key={tx.id}
                  onClick={() => openEditTx(tx)}
                  className="w-full glass-card p-3 flex items-center gap-3 hover:bg-white/[0.08] transition-all text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${CATEGORY_COLORS[tx.category]}33` }}
                  >
                    <CatIcon category={tx.category} className="w-5 h-5" style={{ color: CATEGORY_COLORS[tx.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.title}</p>
                    <p className="text-[10px] text-white/40">
                      {tx.category} &middot; {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FAB */}
      <button onClick={openAddTx} className="fab">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        open={showTxModal}
        onClose={() => { setShowTxModal(false); setEditingTx(null) }}
        onSave={handleSaveTx}
        initial={editingTx}
      />

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
