'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, CATEGORIES, generateId } from '@/lib/types'
import type { Transaction, TransactionCategory } from '@/lib/types'
import {
  ForkKnife, Car, ShoppingBag, Gamepad2, FileText, Heart, Ellipsis,
  TrendingUp, Plus, Trash2, Search, ArrowLeft,
} from 'lucide-react'

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
  open, tx, onSave, onDelete, onClose,
}: {
  open: boolean
  tx: Transaction | null
  onSave: (t: Transaction) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const { state } = useFinanceStore()
  const [form, setForm] = useState<TxForm>({
    isIncome: false, amount: '', title: '', category: 'Other', date: new Date().toISOString().slice(0, 10),
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
    onSave({ ...tx, title: form.title, amount, category: form.category, date: form.date, isIncome: form.isIncome })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>Edit Transaction</h2>

        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-paper-2)' }}>
          {(['Expense', 'Income'] as const).map(label => (
            <button key={label} onClick={() => setForm(f => ({ ...f, isIncome: label === 'Income' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${(label === 'Expense' ? !form.isIncome : form.isIncome) ? 'btn-primary text-sm py-2' : ''}`}
              style={(label === 'Expense' ? !form.isIncome : form.isIncome) ? {} : { color: 'var(--color-ink-2)' }}>
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-paper-2)' }}>
            <span className="text-xl font-bold" style={{ color: 'var(--color-ink-2)' }}>Rp</span>
            <input type="text" inputMode="numeric" placeholder="0" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-xl font-bold outline-none" style={{ color: 'var(--color-ink-0)' }} />
          </div>
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }} />
        </div>

        <div className="mb-4">
          <label className="mono-label mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat]
              const selected = form.category === cat
              return (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${selected ? 'ring-1' : ''}`}
                  style={{ background: selected ? 'var(--color-paper-2)' : 'var(--color-paper-1)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                    <CatIcon category={cat} className="w-4 h-4" style={{ color: selected ? '#fff' : color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: selected ? 'var(--color-ink-0)' : 'var(--color-ink-2)' }}>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="mono-label mb-2 block">Date</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }} />
        </div>

        <div className="flex gap-3">
          <button onClick={() => { onDelete(tx.id); onClose() }}
            className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
            style={{ background: 'color-mix(in oklch, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}>
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex-1 flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1 py-3">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1 py-3">Update</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { state, dispatch } = useFinanceStore()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<TransactionCategory | null>(null)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(() => {
    let list = [...state.transactions]
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    if (filterCat) {
      list = list.filter(t => t.category === filterCat)
    }
    return list
  }, [state.transactions, search, filterCat])

  /* ---------- Add Tx Modal (inline, simplified) ---------- */
  const [addForm, setAddForm] = useState({
    isIncome: false, amount: '', title: '', category: 'Other' as TransactionCategory,
    accountId: null as string | null, date: new Date().toISOString().slice(0, 10),
  })

  const handleAddTx = () => {
    const amount = parseInt(addForm.amount.replace(/\D/g, ''), 10) || 0
    if (!addForm.title || amount <= 0) return
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: generateId(),
        title: addForm.title,
        amount,
        category: addForm.category,
        date: addForm.date,
        isIncome: addForm.isIncome,
        accountId: addForm.accountId,
        createdAt: new Date().toISOString(),
      },
    })
    setAddForm({ isIncome: false, amount: '', title: '', category: 'Other', accountId: null, date: new Date().toISOString().slice(0, 10) })
    setShowAddModal(false)
  }

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
    <div className="pb-24">
      {/* Floating pill nav */}
      <nav className="nav-pill">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-paper-0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-semibold" style={{ color: 'var(--color-ink-0)' }}>Finance Flash</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Dashboard</Link>
          <Link href="/accounts" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Accounts</Link>
          <Link href="/transactions" className="px-3 py-1.5 rounded-full font-medium" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-tint)' }}>Txns</Link>
          <Link href="/recurring" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Recurring</Link>
        </div>
      </nav>

      <main className="section pt-20">
        <h1 className="section-title mb-6">Transactions</h1>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4" style={{ background: 'var(--color-paper-2)' }}>
          <Search className="w-4 h-4" style={{ color: 'var(--color-ink-3)' }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--color-ink-0)' }}
          />
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
          <button
            onClick={() => setFilterCat(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCat === null ? 'btn-primary text-xs py-1.5 px-4' : ''
            }`}
            style={filterCat === null ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat]
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5`}
                style={filterCat === cat ? { background: `${color}33`, color: color } : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
              >
                <CatIcon category={cat} className="w-3 h-3" />
                {cat}
              </button>
            )
          })}
        </div>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div className="card text-center p-10">
            <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tx => {
              const color = CATEGORY_COLORS[tx.category]
              return (
                <button
                  key={tx.id}
                  onClick={() => openEdit(tx)}
                  className="w-full card flex items-center gap-3 hover:scale-[1.01] transition-all text-left"
                  style={{ padding: 'var(--space-md)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}33` }}>
                    <CatIcon category={tx.category} className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="mono-label text-[10px]">{tx.category}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                    {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => setShowAddModal(true)} className="fab">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>Add Transaction</h2>

            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-paper-2)' }}>
              {(['Expense', 'Income'] as const).map(label => (
                <button key={label} onClick={() => setAddForm(f => ({ ...f, isIncome: label === 'Income' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${(label === 'Expense' ? !addForm.isIncome : addForm.isIncome) ? 'btn-primary text-sm py-2' : ''}`}
                  style={(label === 'Expense' ? !addForm.isIncome : addForm.isIncome) ? {} : { color: 'var(--color-ink-2)' }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-paper-2)' }}>
                <span className="text-xl font-bold" style={{ color: 'var(--color-ink-2)' }}>Rp</span>
                <input type="text" inputMode="numeric" placeholder="0" value={addForm.amount}
                  onChange={e => setAddForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
                  className="flex-1 bg-transparent text-xl font-bold outline-none" style={{ color: 'var(--color-ink-0)' }} />
              </div>
            </div>

            <div className="mb-4">
              <input type="text" placeholder="Title" value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }} />
            </div>

            <div className="mb-4">
              <label className="mono-label mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const color = CATEGORY_COLORS[cat]
                  const selected = addForm.category === cat
                  return (
                    <button key={cat} onClick={() => setAddForm(f => ({ ...f, category: cat }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${selected ? 'ring-1' : ''}`}
                      style={{ background: selected ? 'var(--color-paper-2)' : 'var(--color-paper-1)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                        <CatIcon category={cat} className="w-4 h-4" style={{ color: selected ? '#fff' : color }} />
                      </div>
                      <span className="text-[10px]" style={{ color: selected ? 'var(--color-ink-0)' : 'var(--color-ink-2)' }}>{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="mono-label mb-2 block">Account</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setAddForm(f => ({ ...f, accountId: null }))}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${addForm.accountId === null ? 'btn-primary text-xs py-2' : ''}`}
                  style={addForm.accountId === null ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}>
                  None
                </button>
                {state.accounts.map(acc => (
                  <button key={acc.id} onClick={() => setAddForm(f => ({ ...f, accountId: acc.id }))}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${addForm.accountId === acc.id ? 'btn-primary text-xs py-2' : ''}`}
                    style={addForm.accountId === acc.id ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}>
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mono-label mb-2 block">Date</label>
              <input type="date" value={addForm.date}
                onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="btn-ghost flex-1 py-3">Cancel</button>
              <button onClick={handleAddTx}
                className="btn-primary flex-1 py-3">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditTxModal
        open={showEditModal}
        tx={editingTx}
        onSave={handleSaveTx}
        onDelete={handleDeleteTx}
        onClose={() => { setShowEditModal(false); setEditingTx(null) }}
      />

      <style jsx global>{`
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
