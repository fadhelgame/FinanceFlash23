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
      <div className="relative w-full max-w-md bg-[#0a0a1a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-6">Add Account</h2>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs text-white/40 mb-2 block">Account Name</label>
          <input
            type="text"
            placeholder="e.g. Main Wallet"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white outline-none placeholder-white/30"
          />
        </div>

        {/* Type Picker */}
        <div className="mb-4">
          <label className="text-xs text-white/40 mb-3 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map(at => {
              const color = ACCOUNT_TYPE_COLORS[at]
              const selected = type === at
              return (
                <button
                  key={at}
                  onClick={() => setType(at)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    selected ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: selected ? color : `${color}33` }}
                  >
                    <AcctIcon type={at} className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] text-center ${selected ? 'text-white' : 'text-white/50'}`}>
                    {ACCOUNT_TYPE_LABELS[at]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Initial Balance */}
        <div className="mb-6">
          <label className="text-xs text-white/40 mb-2 block">Initial Balance</label>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
            <span className="text-lg font-bold text-white/50">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={balance}
              onChange={e => setBalance(e.target.value.replace(/[^0-9]/g, ''))}
              className="flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder-white/20"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all"
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
    <div className="min-h-screen bg-[#0a0a1a] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Accounts</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto mt-5">
        {accounts.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-white/30" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No accounts yet</h2>
            <p className="text-sm text-white/40 mb-6">Add your first account to start tracking</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
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
                  className="glass-card p-4 flex items-center gap-4 hover:bg-white/[0.08] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}1F` }}
                  >
                    <AcctIcon type={acc.type} className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-white truncate">{acc.name}</p>
                    <p className="text-xs text-white/40">{acc.type}</p>
                  </div>
                  <p className="text-lg font-bold text-white">{formatIDR(balance)}</p>
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
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  )
}
