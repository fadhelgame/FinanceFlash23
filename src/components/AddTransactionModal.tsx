'use client'

import { useState, useEffect } from 'react'
import { useFinanceStore } from '@/lib/store'
import { CATEGORIES, generateId } from '@/lib/types'
import type { Transaction, TransactionCategory } from '@/lib/types'
import { CATEGORY_COLORS, CatIcon, ACCOUNT_TYPE_COLORS, AcctIcon } from '@/lib/ui-utils'

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

export default function AddTransactionModal({
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
  const [form, setForm] = useState<TxForm>(emptyTxForm())

  // Sync form when initial changes (editing different transactions)
  useEffect(() => {
    if (initial) {
      setForm({
        isIncome: initial.isIncome,
        amount: String(initial.amount),
        title: initial.title,
        accountId: initial.accountId,
        category: initial.category,
        date: initial.date.slice(0, 10),
      })
    } else {
      setForm(emptyTxForm())
    }
  }, [initial])

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
