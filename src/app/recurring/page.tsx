'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, CATEGORIES, generateId } from '@/lib/types'
import type { RecurringTransaction, TransactionCategory } from '@/lib/types'
import {
  ForkKnife, Car, ShoppingBag, Gamepad2, FileText, Heart, Ellipsis,
  TrendingUp, Plus, ArrowLeft, RefreshCw,
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

/* ---------- Add/Edit Modal ---------- */

interface RForm {
  isIncome: boolean
  amount: string
  title: string
  dayOfMonth: number
  category: TransactionCategory
  accountId: string | null
  isActive: boolean
}

const emptyForm = (): RForm => ({
  isIncome: false,
  amount: '',
  title: '',
  dayOfMonth: 1,
  category: 'Other',
  accountId: null,
  isActive: true,
})

function RecurringFormModal({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean
  initial?: RecurringTransaction | null
  onSave: (r: RecurringTransaction) => void
  onClose: () => void
}) {
  const { state } = useFinanceStore()
  const [form, setForm] = useState<RForm>(
    initial
      ? {
          isIncome: initial.isIncome,
          amount: String(initial.amount),
          title: initial.title,
          dayOfMonth: initial.dayOfMonth,
          category: initial.category,
          accountId: initial.accountId,
          isActive: initial.isActive,
        }
      : emptyForm()
  )

  if (!open) return null

  const handleSave = () => {
    const amount = parseInt(form.amount.replace(/\D/g, ''), 10) || 0
    if (!form.title || amount <= 0) return

    // Compute next due date
    const today = new Date()
    let nextDate = new Date(today.getFullYear(), today.getMonth(), form.dayOfMonth)
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, form.dayOfMonth)
    }

    onSave({
      id: initial?.id || generateId(),
      title: form.title,
      amount,
      category: form.category,
      isIncome: form.isIncome,
      dayOfMonth: form.dayOfMonth,
      nextDueDate: initial?.nextDueDate || nextDate.toISOString(),
      isActive: form.isActive,
      accountId: form.accountId,
      createdAt: initial?.createdAt || new Date().toISOString(),
    })
    setForm(emptyForm())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>
          {initial ? 'Edit Recurring' : 'Add Recurring'}
        </h2>

        {/* Type toggle */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--color-paper-2)' }}>
          {(['Expense', 'Income'] as const).map(label => (
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
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-paper-2)' }}>
            <span className="text-xl font-bold" style={{ color: 'var(--color-ink-2)' }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))}
              className="flex-1 bg-transparent text-xl font-bold outline-none" style={{ color: 'var(--color-ink-0)' }}
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

        {/* Day of Month */}
        <div className="mb-4">
          <label className="mono-label mb-2 block">Day of Month (1-28)</label>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setForm(f => ({ ...f, dayOfMonth: day }))}
                className={`shrink-0 w-9 h-9 rounded-full text-xs font-medium transition-all ${
                  form.dayOfMonth === day ? 'btn-primary text-xs' : ''
                }`}
                style={form.dayOfMonth === day ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Account chips */}
        <div className="mb-4">
          <label className="mono-label mb-2 block">Account</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setForm(f => ({ ...f, accountId: null }))}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                form.accountId === null ? 'btn-primary text-xs py-2' : ''
              }`}
              style={form.accountId === null ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
            >
              None
            </button>
            {state.accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setForm(f => ({ ...f, accountId: acc.id }))}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  form.accountId === acc.id ? 'btn-primary text-xs py-2' : ''
                }`}
                style={form.accountId === acc.id ? {} : { background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}
              >
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
                  style={{ background: selected ? 'var(--color-paper-2)' : 'var(--color-paper-1)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: selected ? color : `${color}33` }}>
                    <CatIcon category={cat} className="w-4 h-4" style={{ color: selected ? '#fff' : color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: selected ? 'var(--color-ink-0)' : 'var(--color-ink-2)' }}>{cat}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
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

/* ---------- Main Page ---------- */

export default function RecurringPage() {
  const { state, dispatch } = useFinanceStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)

  const recurringItems = state.recurringTransactions

  const activeItems = useMemo(() => recurringItems.filter(r => r.isActive), [recurringItems])
  const pausedItems = useMemo(() => recurringItems.filter(r => !r.isActive), [recurringItems])

  const totalIncome = useMemo(
    () => activeItems.filter(r => r.isIncome).reduce((s, r) => s + r.amount, 0),
    [activeItems]
  )
  const totalExpense = useMemo(
    () => activeItems.filter(r => !r.isIncome).reduce((s, r) => s + r.amount, 0),
    [activeItems]
  )

  const handleSave = (r: RecurringTransaction) => {
    if (editing) {
      dispatch({ type: 'UPDATE_RECURRING', payload: r })
    } else {
      dispatch({ type: 'ADD_RECURRING', payload: r })
    }
    setEditing(null)
    setShowModal(false)
  }

  const handleToggle = (r: RecurringTransaction) => {
    dispatch({ type: 'UPDATE_RECURRING', payload: { ...r, isActive: !r.isActive } })
  }

  const openEdit = (r: RecurringTransaction) => {
    setEditing(r)
    setShowModal(true)
  }

  const openAdd = () => {
    setEditing(null)
    setShowModal(true)
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
          <Link href="/transactions" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Txns</Link>
          <Link href="/recurring" className="px-3 py-1.5 rounded-full font-medium" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-tint)' }}>Recurring</Link>
        </div>
      </nav>

      <main className="section pt-20">
        <h1 className="section-title mb-6">Recurring</h1>

        {/* Monthly Summary */}
        <div className="balance-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5" style={{ opacity: 0.7 }} />
            <p className="text-sm" style={{ opacity: 0.7 }}>Monthly Recurring</p>
          </div>
          <p className="text-3xl font-bold"><span className="italic-accent">{formatIDR(totalIncome - totalExpense)}</span></p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-income">+{formatIDR(totalIncome)}</span>
            <span className="text-expense">-{formatIDR(totalExpense)}</span>
          </div>
        </div>

        {/* Active Section */}
        <section className="mb-8">
          <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)' }}>
            Active <span style={{ color: 'var(--color-ink-3)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>({activeItems.length})</span>
          </h2>
          {activeItems.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No active recurring transactions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeItems.map(r => {
                const color = CATEGORY_COLORS[r.category]
                const nextDate = new Date(r.nextDueDate)
                return (
                  <div key={r.id} className="card flex items-center gap-3" style={{ padding: 'var(--space-md)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}33` }}>
                      <CatIcon category={r.category} className="w-5 h-5" style={{ color }} />
                    </div>
                    <button
                      onClick={() => openEdit(r)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{r.title}</p>
                      <p className="mono-label text-[10px] mt-0.5">
                        Day {r.dayOfMonth} &middot; Due {nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${r.isIncome ? 'text-income' : 'text-expense'}`}>
                        {formatIDR(r.amount)}
                      </span>
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(r)}
                        className={`relative w-11 h-6 rounded-full transition-all ${
                          r.isActive ? '' : ''
                        }`}
                        style={{ background: r.isActive ? 'var(--color-accent)' : 'var(--color-paper-2)' }}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${
                            r.isActive ? 'left-[22px]' : 'left-0.5'
                          }`}
                          style={{ background: 'var(--color-paper-0)' }}
                        />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Paused Section */}
        {pausedItems.length > 0 && (
          <section className="mb-8">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)' }}>
              Paused <span style={{ color: 'var(--color-ink-3)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>({pausedItems.length})</span>
            </h2>
            <div className="space-y-2">
              {pausedItems.map(r => {
                const color = CATEGORY_COLORS[r.category]
                const nextDate = new Date(r.nextDueDate)
                return (
                  <div key={r.id} className="card flex items-center gap-3" style={{ padding: 'var(--space-md)', opacity: 0.6 }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}33` }}>
                      <CatIcon category={r.category} className="w-5 h-5" style={{ color }} />
                    </div>
                    <button
                      onClick={() => openEdit(r)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{r.title}</p>
                      <p className="mono-label text-[10px] mt-0.5">
                        Day {r.dayOfMonth} &middot; Due {nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${r.isIncome ? 'text-income' : 'text-expense'}`}>
                        {formatIDR(r.amount)}
                      </span>
                      <button
                        onClick={() => handleToggle(r)}
                        className="relative w-11 h-6 rounded-full transition-all"
                        style={{ background: 'var(--color-paper-2)' }}
                      >
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow" style={{ background: 'var(--color-ink-3)' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* FAB */}
      <button onClick={openAdd} className="fab">
        <Plus className="w-6 h-6" />
      </button>

      <RecurringFormModal
        open={showModal}
        initial={editing}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditing(null) }}
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
