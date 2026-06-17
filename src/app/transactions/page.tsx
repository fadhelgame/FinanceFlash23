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
      <div className="relative w-full max-w-md bg-[#0a0a1a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-6">Edit Transaction</h2>

        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          {(['Expense', 'Income'] as const).map(label => (
            <button key={label} onClick={() => setForm(f => ({ ...f, isIncome: label === 'Income' }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${(label === 'Expense' ? !form.isIncome : form.isIncome) ? 'bg-blue-600 text-white' : 'text-white/50'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-xl font-bold text-white/50">Rp</span>
            <input type="text" inputMode="numeric" placeholder="0" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-white/20" />
          </div>
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none placeholder-white/30" />
        </div>

        <div className="mb-4">
          <label className="text-xs text-white/40 mb-2 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const color = CATEGORY_COLORS[cat]
              const selected = form.category === cat
              return (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${selected ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                    <CatIcon category={cat} className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-[10px] ${selected ? 'text-white' : 'text-white/50'}`}>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs text-white/40 mb-2 block">Date</label>
          <input type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => { onDelete(tx.id); onClose() }}
            className="px-4 py-3 rounded-xl bg-red-500/15 text-red-400 font-medium hover:bg-red-500/25 transition-all flex items-center gap-2">
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
    <div className="min-h-screen bg-[#0a0a1a] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Transactions</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto mt-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/30"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCat(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCat === null ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat]
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  filterCat === cat ? 'text-white' : 'text-white/50 bg-white/5 hover:bg-white/10'
                }`}
                style={filterCat === cat ? { background: `${color}33`, color: color } : {}}
              >
                <CatIcon category={cat} className="w-3 h-3" />
                {cat}
              </button>
            )
          })}
        </div>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-white/30 text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(tx => {
              const color = CATEGORY_COLORS[tx.category]
              return (
                <button
                  key={tx.id}
                  onClick={() => openEdit(tx)}
                  className="w-full glass-card p-3 flex items-center gap-3 hover:bg-white/[0.08] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}33` }}>
                    <CatIcon category={tx.category} className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{tx.category}</span>
                      <span className="text-[10px] text-white/40">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-green-400' : 'text-red-400'}`}>
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
          <div className="relative w-full max-w-md bg-[#0a0a1a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <h2 className="text-lg font-semibold text-white mb-6">Add Transaction</h2>

            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              {(['Expense', 'Income'] as const).map(label => (
                <button key={label} onClick={() => setAddForm(f => ({ ...f, isIncome: label === 'Income' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${(label === 'Expense' ? !addForm.isIncome : addForm.isIncome) ? 'bg-blue-600 text-white' : 'text-white/50'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-xl font-bold text-white/50">Rp</span>
                <input type="text" inputMode="numeric" placeholder="0" value={addForm.amount}
                  onChange={e => setAddForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
                  className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-white/20" />
              </div>
            </div>

            <div className="mb-4">
              <input type="text" placeholder="Title" value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none placeholder-white/30" />
            </div>

            <div className="mb-4">
              <label className="text-xs text-white/40 mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const color = CATEGORY_COLORS[cat]
                  const selected = addForm.category === cat
                  return (
                    <button key={cat} onClick={() => setAddForm(f => ({ ...f, category: cat }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${selected ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                        <CatIcon category={cat} className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-[10px] ${selected ? 'text-white' : 'text-white/50'}`}>{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-white/40 mb-2 block">Account</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button onClick={() => setAddForm(f => ({ ...f, accountId: null }))}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${addForm.accountId === null ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50'}`}>
                  None
                </button>
                {state.accounts.map(acc => (
                  <button key={acc.id} onClick={() => setAddForm(f => ({ ...f, accountId: acc.id }))}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${addForm.accountId === acc.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50'}`}>
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-white/40 mb-2 block">Date</label>
              <input type="date" value={addForm.date}
                onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleAddTx}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all">Save</button>
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
