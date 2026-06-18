'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import NavBar from '@/components/NavBar'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, CATEGORIES, generateId, getActiveAccounts } from '@/lib/types'
import type { Transaction, TransactionCategory } from '@/lib/types'
import { CATEGORY_COLORS, CatIcon } from '@/lib/ui-utils'
import {
  Plus, Trash2, Search, ArrowLeft, CheckSquare, Square,
} from 'lucide-react'

type DateFilter = 'all' | 'this-month' | 'last-month' | 'custom'

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'custom', label: 'Custom' },
]

function formatMonth(d: Date): string {
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
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
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set())
  const [assignAccountId, setAssignAccountId] = useState('')

  const accounts = getActiveAccounts(state.accounts)

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
    // Date filter
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    if (dateFilter === 'this-month') {
      list = list.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
    } else if (dateFilter === 'last-month') {
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
      list = list.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear
      })
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      end.setHours(23, 59, 59, 999)
      list = list.filter(t => {
        const d = new Date(t.date)
        return d >= start && d <= end
      })
    }
    return list
  }, [state.transactions, search, filterCat, dateFilter, customStart, customEnd])

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
    <AuthGuard>
      <div className="pb-24">
      <NavBar />

      <main className="section pt-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title" style={{ margin: 0 }}>Transactions</h1>
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
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3" style={{ background: 'var(--color-paper-2)' }}>
          <Search className="w-4 h-4" style={{ color: 'var(--color-ink-3)' }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--color-ink-0)' }}
          />
        </div>

        {/* Date filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
          {DATE_FILTERS.map(df => (
            <button
              key={df.value}
              onClick={() => setDateFilter(df.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                dateFilter === df.value ? 'btn-primary text-xs py-1.5 px-4' : ''
              }`}
              style={dateFilter === df.value ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
            />
            <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
            />
          </div>
        )}

        {/* Filter summary */}
        {dateFilter !== 'all' && (
          <p className="mono-label text-[10px] mb-3">
            Showing: {dateFilter === 'this-month' ? formatMonth(new Date()) : dateFilter === 'last-month' ? formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)) : `${customStart || '?'} — ${customEnd || '?'}`}
            {' · '}{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

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
              const accountName = accounts.find(a => a.id === tx.accountId)?.name
              const isSelected = selectedTxIds.has(tx.id)
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}33` }}>
                    <CatIcon category={tx.category} className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="mono-label text-[10px]">{tx.category}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-ink-3)' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      {accountName ? (
                        <span className="text-[10px]" style={{ color: 'var(--color-accent)' }}>{accountName}</span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--color-warning)' }}>No account</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
                    {tx.isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                  </span>
                </button>
              ) : (
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
                      {accountName ? (
                        <span className="text-[10px]" style={{ color: 'var(--color-accent)' }}>{accountName}</span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--color-warning)' }}>No account</span>
                      )}
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
                  const tx = state.transactions.find(t => t.id === id)
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
    </AuthGuard>
  )
}
