'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, getAccountBalance, getActiveAccounts, getSettledAccounts, ACCOUNT_ICONS, ACCOUNT_TYPES, generateId } from '@/lib/types'
import type { Account, AccountType } from '@/lib/types'
import { ACCOUNT_TYPE_COLORS, AcctIcon } from '@/lib/ui-utils'
import { Wallet, Plus, Check, Trash2, CheckSquare, Square, Pencil } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'

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
  const [tab, setTab] = useState<'active' | 'settled'>('active')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [renamingAccount, setRenamingAccount] = useState<Account | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const transactions = state.transactions
  const activeAccounts = getActiveAccounts(state.accounts)
  const settledAccounts = getSettledAccounts(state.accounts)

  const displayAccounts = tab === 'active' ? activeAccounts : settledAccounts

  const handleAdd = (account: Account) => {
    dispatch({ type: 'ADD_ACCOUNT', payload: account })
  }

  return (
    <AuthGuard>
    <div className="pb-24">
      <NavBar />

      <main className="section pt-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title" style={{ margin: 0 }}>Accounts</h1>
          {selectMode ? (
            <button
              onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
              className="btn btn-ghost text-sm px-3 py-1.5"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary text-sm px-5 py-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setTab('active')}
            className={tab === 'active' ? 'btn-primary px-4 py-2 text-sm' : 'btn-ghost px-4 py-2 text-sm'}
          >
            Active
          </button>
          <button
            onClick={() => setTab('settled')}
            className={tab === 'settled' ? 'btn-primary px-4 py-2 text-sm' : 'btn-ghost px-4 py-2 text-sm'}
          >
            Settled Loans
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSelectMode(!selectMode)}
            className="btn btn-ghost text-sm px-3 py-1.5"
          >
            {selectMode ? 'Cancel' : 'Manage'}
          </button>
        </div>

        {tab === 'active' ? (
          <>
            {activeAccounts.length === 0 ? (
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
                {activeAccounts.map(acc => {
                  const balance = getAccountBalance(acc, transactions)
                  const color = ACCOUNT_TYPE_COLORS[acc.type]
                  const isSelected = selectedIds.has(acc.id)
                  return selectMode ? (
                    <button
                      key={acc.id}
                      onClick={() => {
                        const next = new Set(selectedIds)
                        if (isSelected) next.delete(acc.id)
                        else next.add(acc.id)
                        setSelectedIds(next)
                      }}
                      className="card flex items-center gap-4 w-full text-left"
                      style={{ borderColor: isSelected ? 'var(--color-accent)' : undefined, borderWidth: isSelected ? '1.5px' : undefined }}
                    >
                      <div style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-ink-3)' }}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}1F` }}>
                        <AcctIcon type={acc.type} className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{acc.name}</p>
                        <p className="mono-label text-xs mt-0.5">{acc.type}</p>
                      </div>
                      <p className="text-lg font-bold" style={{ color: 'var(--color-ink-0)' }}>{formatIDR(balance)}</p>
                    </button>
                  ) : (
                    <Link
                      key={acc.id}
                      href={`/accounts/${acc.id}`}
                      className="card flex items-center gap-4 hover:scale-[1.01] transition-all"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}1F` }}>
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
          </>
        ) : (
          <>
            {settledAccounts.length === 0 ? (
              <div className="card text-center p-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-paper-2)' }}>
                  <Check className="w-7 h-7" style={{ color: 'var(--color-success)' }} />
                </div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink-0)' }}>No settled loans</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-ink-2)' }}>Settled loan accounts will appear here</p>
                <button
                  onClick={() => setTab('active')}
                  className="btn btn-primary"
                >
                  View active accounts
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {settledAccounts.map(acc => {
                  const color = ACCOUNT_TYPE_COLORS[acc.type]
                  return (
                    <div
                      key={acc.id}
                      className="card flex items-center gap-4 opacity-60"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${color}1F` }}
                      >
                        <AcctIcon type={acc.type} className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{acc.name}</p>
                        <p className="mono-label text-xs mt-0.5">Settled · {new Date(acc.settledAt!).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span
                        className="text-xs mono-label px-2 py-1 rounded-full"
                        style={{ background: 'color-mix(in oklch, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}
                      >
                        <Check className="w-3 h-3 inline-block mr-1" />Paid
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Batch action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card flex items-center gap-3 px-5 py-3 shadow-lg">
          <span className="text-sm font-medium shrink-0" style={{ color: 'var(--color-ink-0)' }}>
            {selectedIds.size} selected
          </span>
          {selectedIds.size === 1 && (
            <button
              onClick={() => {
                const acc = activeAccounts.find(a => selectedIds.has(a.id)) || settledAccounts.find(a => selectedIds.has(a.id))
                if (acc) {
                  setRenamingAccount(acc)
                  setRenameValue(acc.name)
                }
              }}
              className="text-sm px-4 py-1.5 shrink-0 rounded-xl font-medium transition-all flex items-center gap-1.5"
              style={{ color: 'var(--color-accent)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklch, var(--color-accent) 10%, transparent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Rename
            </button>
          )}
          <div className="w-px h-6 shrink-0" style={{ background: 'color-mix(in oklch, var(--color-ink-0) 10%, transparent)' }} />
          <button
            onClick={() => {
              const count = selectedIds.size
              if (confirm(`Delete ${count} account${count > 1 ? 's' : ''}?`)) {
                selectedIds.forEach(id => dispatch({ type: 'DELETE_ACCOUNT', payload: id }))
                setSelectedIds(new Set())
                setSelectMode(false)
              }
            }}
            className="text-sm px-4 py-1.5 shrink-0 rounded-xl font-medium transition-all flex items-center gap-1.5"
            style={{ color: 'var(--color-warning)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklch, var(--color-warning) 10%, transparent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renamingAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRenamingAccount(null)} />
          <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>Rename Account</h2>
            <div className="mb-6">
              <label className="mono-label mb-2 block">Account Name</label>
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...renamingAccount, name: renameValue.trim() } })
                    setRenamingAccount(null)
                    setSelectedIds(new Set())
                    setSelectMode(false)
                  }
                }}
                className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-0)' }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRenamingAccount(null)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button
                onClick={() => {
                  if (!renameValue.trim()) return
                  dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...renamingAccount, name: renameValue.trim() } })
                  setRenamingAccount(null)
                  setSelectedIds(new Set())
                  setSelectMode(false)
                }}
                className="btn-primary flex-1 py-3"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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
    </AuthGuard>
  )
}
