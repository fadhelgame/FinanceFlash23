'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, getAccountBalance, ACCOUNT_ICONS, ACCOUNT_TYPES, generateId } from '@/lib/types'
import type { Account, AccountType } from '@/lib/types'
import { Banknote, Wallet, ArrowLeftRight, CreditCard, Smartphone, Shield, Plus, ArrowLeft } from 'lucide-react'

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  Cash: '#22c55e',
  Bank: '#3b82f6',
  'Credit Card': '#f97316',
  Loan: '#ef4444',
  'E-Wallet': '#a855f7',
  Savings: '#14b8a6',
}

function AcctIcon({ type, className, style }: { type: AccountType; className?: string; style?: React.CSSProperties }) {
  const iconName = ACCOUNT_ICONS[type]
  const props = { className: className || 'w-5 h-5', style: style || { color: 'var(--color-ink-0)' } }
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

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Cash: 'Cash',
  Bank: 'Bank',
  'Credit Card': 'Credit Card',
  Loan: 'Loan',
  'E-Wallet': 'E-Wallet',
  Savings: 'Savings',
}

function AddAccountModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (a: Account) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('Cash')
  const [balance, setBalance] = useState('')

  if (!open) return null

  const handleSave = () => {
    const initialBalance = parseInt(balance.replace(/\D/g, ''), 10) || 0
    if (!name.trim()) return
    onSave({
      id: generateId(),
      name: name.trim(),
      type,
      initialBalance,
      createdAt: new Date().toISOString(),
    })
    setName('')
    setType('Cash')
    setBalance('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>Add Account</h2>

        {/* Name */}
        <div className="mb-4">
          <label className="mono-label mb-2 block">Account Name</label>
          <input
            type="text"
            placeholder="e.g. Main Wallet"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
          />
        </div>

        {/* Type Picker */}
        <div className="mb-4">
          <label className="mono-label mb-3 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map(at => {
              const color = ACCOUNT_TYPE_COLORS[at]
              const selected = type === at
              return (
                <button
                  key={at}
                  onClick={() => setType(at)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all`}
                  style={{
                    background: selected ? 'var(--color-paper-2)' : 'var(--color-paper-1)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: selected ? color : `${color}33` }}
                  >
                    <AcctIcon type={at} className="w-4 h-4" style={{ color: selected ? '#fff' : color }} />
                  </div>
                  <span className="text-[10px] text-center" style={{ color: selected ? 'var(--color-ink-0)' : 'var(--color-ink-2)' }}>
                    {ACCOUNT_TYPE_LABELS[at]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Initial Balance */}
        <div className="mb-6">
          <label className="mono-label mb-2 block">Initial Balance</label>
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-paper-2)' }}>
            <span className="text-lg font-bold" style={{ color: 'var(--color-ink-2)' }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={balance}
              onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
              className="flex-1 bg-transparent text-lg font-bold outline-none" style={{ color: 'var(--color-ink-0)' }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
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
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const { state, dispatch } = useFinanceStore()
  const [showModal, setShowModal] = useState(false)

  const accounts = state.accounts
  const transactions = state.transactions

  const handleAdd = (account: Account) => {
    dispatch({ type: 'ADD_ACCOUNT', payload: account })
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
          <Link href="/accounts" className="px-3 py-1.5 rounded-full font-medium" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-tint)' }}>Accounts</Link>
          <Link href="/transactions" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Txns</Link>
          <Link href="/recurring" className="px-3 py-1.5 rounded-full hover:bg-[var(--color-paper-2)] transition-all" style={{ color: 'var(--color-ink-2)' }}>Recurring</Link>
        </div>
      </nav>

      <main className="section pt-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title" style={{ margin: 0 }}>Accounts</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary text-sm px-5 py-2"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="card text-center p-10">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-paper-2)' }}>
              <Wallet className="w-7 h-7" style={{ color: 'var(--color-ink-3)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>No accounts yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-ink-2)' }}>Add your first account to start tracking</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {accounts.map(acc => {
              const balance = getAccountBalance(acc, transactions)
              const color = ACCOUNT_TYPE_COLORS[acc.type]
              return (
                <Link
                  key={acc.id}
                  href={`/accounts/${acc.id}`}
                  className="card flex items-center gap-4 hover:scale-[1.01] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}1F` }}
                  >
                    <AcctIcon type={acc.type} className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{acc.name}</p>
                    <p className="mono-label text-xs mt-0.5">{acc.type}</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'var(--color-ink-0)' }}>{formatIDR(balance)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fab"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddAccountModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAdd}
      />

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
