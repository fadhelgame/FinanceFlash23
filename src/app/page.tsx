'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useFinanceStore } from '@/lib/store'
import NavBar from '@/components/NavBar'
import {
  formatIDR,
  getTotalBalance,
  getTotalIncome,
  getTotalExpense,
  getAccountBalance,
  getActiveAccounts,
  getSettledAccounts,
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
      <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
        {/* Type toggle */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-paper-2)' }}>
          {(['Expense', 'Income'] as const).map((label) => (
            <button
              key={label}
              onClick={() => setForm(f => ({ ...f, isIncome: label === 'Income' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                (label === 'Expense' ? !form.isIncome : form.isIncome)
                  ? 'btn-primary text-sm py-2'
                  : '' 
              }`}
              style={(label === 'Expense' ? !form.isIncome : form.isIncome) ? {} : { color: 'var(--color-ink-2)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-paper-2)' }}>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-ink-2)' }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-2xl font-bold outline-none" style={{ color: 'var(--color-ink-0)' }}
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
            className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
          />
        </div>

        {/* Account chips */}
        <div className="mb-4">
          <label className="mono-label mb-2 block">Account</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setForm(f => ({ ...f, accountId: null }))}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                form.accountId === null
                  ? 'btn-primary text-xs py-2'
                  : ''
              }`}
              style={form.accountId === null ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
            >
              None
            </button>
            {state.accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setForm(f => ({ ...f, accountId: acc.id }))}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  form.accountId === acc.id
                    ? 'btn-primary text-xs py-2'
                    : ''
                }`}
                style={form.accountId === acc.id ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
              >
                <AcctIcon type={acc.type} className="w-3.5 h-3.5" />
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category grid */}
        <div className="mb-4">
          <label className="mono-label mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat]
              const selected = form.category === cat
              return (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    selected ? 'ring-1' : ''
                  }`}
                  style={{
                    background: selected ? 'var(--color-paper-2)' : 'var(--color-paper-1)',
                    ...(selected ? { ringColor: 'var(--color-accent)' } : {})
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: selected ? color : `${color}33` }}
                  >
                    <CatIcon category={cat} className="w-4 h-4" style={{ color: selected ? '#fff' : color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: selected ? 'var(--color-ink-0)' : 'var(--color-ink-2)' }}>
                    {cat}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="mono-label mb-2 block">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="btn-ghost flex-1 py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 py-3"
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

  const accounts = getActiveAccounts(state.accounts)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--color-ink-2)' }}>Loading...</div>
      </div>
    )
  }

  // ---------- Unauthenticated landing ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen page-grid">

        {/* Hero */}
        <section className="section pt-32 sm:pt-40 pb-20 sm:pb-32 text-center relative">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mono-label mb-8"
              style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent)', border: '1px solid color-mix(in oklch, var(--color-accent) 20%, transparent)' }}
            >
              <span className="live-dot" />
              Your data, your control
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.96] tracking-[-0.03em] mb-6"
              style={{ color: 'var(--color-ink-0)' }}
            >
              Track your money.<br />
              <span className="italic-accent">In a flash.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-lg sm:text-xl max-w-xl mx-auto mb-10"
              style={{ color: 'var(--color-ink-1)' }}
            >
              Finance Flash is a personal finance tracker that works on any device. 
              No installation, no syncing, no headaches. Your data stays in your Google Drive.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button onClick={login} className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost px-8 py-3.5 text-base"
              >
                Learn more
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <motion.section
          id="features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section pb-20 sm:pb-32"
        >
          <div className="max-w-5xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mono-label text-center mb-3"
            >
              FEATURES
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-center mb-16"
              style={{ color: 'var(--color-ink-0)' }}
            >
              Everything you need to <span className="italic-accent">stay on top</span>
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: '#22c55e',
                  title: 'Track Income & Expenses',
                  desc: 'Log every transaction in seconds. Categorise your spending — Food, Transport, Bills, and more. Know where your money goes.',
                },
                {
                  icon: <Wallet className="w-5 h-5" />,
                  color: '#3b82f6',
                  title: 'Multiple Accounts',
                  desc: 'Cash, Bank, E-Wallet, Credit Card, Savings — manage them all in one place. Each account keeps its own balance.',
                },
                {
                  icon: <RefreshCw className="w-5 h-5" />,
                  color: '#a855f7',
                  title: 'Recurring Transactions',
                  desc: 'Set up monthly bills, subscriptions, and salary. Finance Flash auto-generates them so you never miss a thing.',
                },
                {
                  icon: <ArrowDownLeft className="w-5 h-5" />,
                  color: '#14b8a6',
                  title: 'Export CSV & PDF',
                  desc: 'Export any account or your full ledger. Perfect for tax season, budgeting reviews, or sharing with your partner.',
                },
                {
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                  color: '#f97316',
                  title: 'Google Drive Backup',
                  desc: 'All your data syncs to your own Google Drive. No servers, no strangers — just you and your spreadsheet-in-the-sky.',
                },
                {
                  icon: <Smartphone className="w-5 h-5" />,
                  color: '#ec4899',
                  title: 'Works Everywhere',
                  desc: 'Open it on your phone, laptop, or tablet. It is a web app — no App Store, no updates, no expiry.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="card p-6"
                  style={{ cursor: 'default' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: `${feature.color}1F` }}>
                    <span style={{ color: feature.color }}>{feature.icon}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>{feature.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-ink-1)' }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          className="section pb-32 text-center"
        >
          <div className="max-w-2xl mx-auto balance-card" style={{ padding: 'var(--space-3xl) var(--space-xl)' }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to <span className="italic-accent">take control</span>?
            </h2>
            <p className="text-base sm:text-lg mb-8" style={{ opacity: 0.8 }}>
              Start tracking your finances today. No credit card, no download, no commitment.
            </p>
            <button
              onClick={login}
              className="btn-primary px-8 py-3.5 text-base"
              style={{
                background: 'var(--color-paper-0)',
                color: 'var(--color-ink-0)',
                borderColor: 'var(--color-paper-0)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-paper-0)'; e.currentTarget.style.borderColor = 'var(--color-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-paper-0)'; e.currentTarget.style.color = 'var(--color-ink-0)'; e.currentTarget.style.borderColor = 'var(--color-paper-0)' }}
            >
              Get started free
            </button>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="section pb-12"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid color-mix(in oklch, var(--color-ink-0) 10%, transparent)', paddingTop: 'var(--space-xl)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <svg className="w-3 h-3" style={{ color: 'var(--color-paper-0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-ink-0)' }}>Finance Flash</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs underline" style={{ color: 'var(--color-ink-3)' }}>Privacy</Link>
            <Link href="/terms" className="text-xs underline" style={{ color: 'var(--color-ink-3)' }}>Terms</Link>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>Built for personal use. Your data stays in your Google Drive.</p>
        </div>
        </motion.footer>
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
    <div className="pb-24">
      <NavBar />

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
                <div className="absolute right-0 top-full mt-1 z-20 card p-1 overflow-hidden" style={{ minWidth: '140px' }}>
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
            <Link href="/transactions" className="btn btn-ghost text-sm px-4 py-2">
              See all
            </Link>
          </div>
          {latestTx.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No transactions yet. Tap + to add one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestTx.map(tx => (
                <button
                  key={tx.id}
                  onClick={() => openEditTx(tx)}
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
                    </p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
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
    </div>
  )
}
