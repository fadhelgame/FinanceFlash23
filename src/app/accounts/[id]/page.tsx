'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, getAccountBalance, getTotalIncome, getTotalExpense, ACCOUNT_ICONS, CATEGORIES, generateId } from '@/lib/types'
import type { Account, Transaction, TransactionCategory, AccountType } from '@/lib/types'
import { useParams } from 'next/navigation'
import {
  Banknote, Wallet, ArrowLeftRight, CreditCard, Smartphone, Shield,
  ForkKnife, Car, ShoppingBag, Gamepad2, FileText, Heart, Ellipsis,
  TrendingUp, TrendingDown, Trash2, ArrowLeft,
} from 'lucide-react'

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

/* ---------- Edit Transaction Modal ---------- */
interface TxForm {
  isIncome: boolean
  amount: string
  title: string
  category: TransactionCategory
  date: string
}

function EditTxModal({
  open,
  tx,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean
  tx: Transaction | null
  onSave: (t: Transaction) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<TxForm>({
    isIncome: false,
    amount: '',
    title: '',
    category: 'Other',
    date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (tx) {
      setForm({
        isIncome: tx.isIncome,
        amount: String(tx.amount),
        title: tx.title,
        category: tx.category,
        date: tx.date.slice(0, 10),
      })
    }
  }, [tx])

  if (!open || !tx) return null

  const handleSave = () => {
    const amount = parseInt(form.amount.replace(/\D/g, ''), 10) || 0
    if (!form.title || amount <= 0) return
    onSave({
      ...tx,
      title: form.title,
      amount,
      category: form.category,
      date: form.date,
      isIncome: form.isIncome,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0a0a1a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-6">Edit Transaction</h2>

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
        <div className="mb-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-xl font-bold text-white/50">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-white/20"
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                    <CatIcon category={cat} className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-[10px] ${selected ? 'text-white' : 'text-white/50'}`}>{cat}</span>
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
            onClick={() => { onDelete(tx.id); onClose() }}
            className="px-4 py-3 rounded-xl bg-red-500/15 text-red-400 font-medium hover:bg-red-500/25 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex-1 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all">Update</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountDetailPage() {
  const params = useParams()
  const { state, dispatch } = useFinanceStore()
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Next.js 27: params are Promises — we resolve via useEffect
  const [accountId, setAccountId] = useState<string | null>(null)
  useEffect(() => {
    const resolve = async () => {
      const resolved = await (params as any).id
      setAccountId(resolved)
    }
    resolve()
  }, [params])

  const account = useMemo(
    () => state.accounts.find(a => a.id === accountId) || null,
    [state.accounts, accountId]
  )

  const accountTransactions = useMemo(
    () => state.transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions, accountId]
  )

  const income = useMemo(() => getTotalIncome(accountTransactions), [accountTransactions])
  const expense = useMemo(() => getTotalExpense(accountTransactions), [accountTransactions])

  const balance = useMemo(
    () => account ? getAccountBalance(account, state.transactions) : 0,
    [account, state.transactions]
  )

  // ---- Loading / not found ----
  if (!accountId || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="text-white/50 animate-pulse">Loading...</div>
      </div>
    )
  }

  const color = ACCOUNT_TYPE_COLORS[account.type]

  const handleSaveTx = (tx: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: tx })
  }

  const handleDeleteTx = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/accounts" className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white truncate">{account.name}</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto mt-5 space-y-5">
        {/* Account Header Card */}
        <div className="gradient-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${color}33` }}>
              <AcctIcon type={account.type} className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p className="text-sm text-white/50">{account.type}</p>
            </div>
          </div>
          <p className="text-sm text-white/50 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-white">{formatIDR(balance)}</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-white/40">Income</span>
            </div>
            <p className="text-lg font-bold text-green-400">{formatIDR(income)}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-white/40">Expense</span>
            </div>
            <p className="text-lg font-bold text-red-400">{formatIDR(expense)}</p>
          </div>
        </div>

        {/* Transactions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Transactions</h2>
          {accountTransactions.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-white/30 text-sm">No transactions for this account</p>
            </div>
          ) : (
            <div className="space-y-1">
              {accountTransactions.map(tx => {
                const catColor = CATEGORY_COLORS[tx.category]
                return (
                  <button
                    key={tx.id}
                    onClick={() => openEdit(tx)}
                    className="w-full glass-card p-3 flex items-center gap-3 hover:bg-white/[0.08] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${catColor}33` }}>
                      <CatIcon category={tx.category} className="w-5 h-5" style={{ color: catColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.title}</p>
                      <p className="text-[10px] text-white/40">{tx.category} &middot; {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <EditTxModal
        open={showEditModal}
        tx={editingTx}
        onSave={handleSaveTx}
        onDelete={handleDeleteTx}
        onClose={() => { setShowEditModal(false); setEditingTx(null) }}
      />

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  )
}
