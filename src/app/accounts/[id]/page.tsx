'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import AuthGuard from '@/components/AuthGuard'
import { useFinanceStore } from '@/lib/store'
import { formatIDR, getAccountBalance, getTotalIncome, getTotalExpense, ACCOUNT_ICONS, CATEGORIES, generateId } from '@/lib/types'
import type { Account, Transaction, TransactionCategory } from '@/lib/types'
import { useParams } from 'next/navigation'
import { CATEGORY_COLORS, CatIcon, ACCOUNT_TYPE_COLORS, AcctIcon } from '@/lib/ui-utils'
import { TrendingUp, TrendingDown, Trash2, ArrowLeft, Download, Check } from 'lucide-react'

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
      <div className="relative w-full max-w-md card rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up" style={{ background: 'var(--color-paper-0)' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-ink-0)' }}>Edit Transaction</h2>

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
            onClick={() => { onDelete(tx.id); onClose() }}
            className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
            style={{ background: 'color-mix(in oklch, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}
          >
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

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function exportCSV(accountName: string, transactions: Transaction[]) {
  const header = 'Date,Title,Category,Type,Amount'
  const rows = transactions.map(t =>
    `${t.date.slice(0, 10)},"${t.title}",${t.category},${t.isIncome ? 'Income' : 'Expense'},${t.isIncome ? t.amount : -t.amount}`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${accountName.replace(/\s+/g, '-').toLowerCase()}-transactions.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(accountName: string, transactions: Transaction[], balance: number, income: number, expense: number) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${accountName} — Finance Flash</title>
<style>
  body { font-family: Geist, system-ui, sans-serif; padding: 48px; color: #1a1a2e; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 24px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .summary-card { padding: 16px; border-radius: 12px; flex: 1; }
  .summary-card .label { font-size: 9px; text-transform: uppercase; color: #666; margin: 0 0 4px; }
  .summary-card .value { font-size: 15px; font-weight: bold; margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1a1a2e; color: white; padding: 8px 14px; text-align: left; font-size: 9px; text-transform: uppercase; }
  td { padding: 8px 14px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #fafafa; }
  .green { color: #22c55e; }
  .red { color: #ef4444; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 16px; }
</style></head><body>
<h1>${accountName}</h1>
<p class="sub">Finance Flash · Generated ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<div class="summary">
  <div class="summary-card" style="background:#eef2ff;"><p class="label">Balance</p><p class="value">${formatRupiah(balance)}</p></div>
  <div class="summary-card" style="background:#f0fdf4;"><p class="label">Income</p><p class="value green">${formatRupiah(income)}</p></div>
  <div class="summary-card" style="background:#fef2f2;"><p class="label">Expense</p><p class="value red">${formatRupiah(expense)}</p></div>
</div>
<table><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th></tr>
${transactions.map(t => `<tr><td>${new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>${t.title}</td><td>${t.category}</td><td class="${t.isIncome ? 'green' : 'red'}">${t.isIncome ? '+' : '-'}${formatRupiah(t.amount)}</td></tr>`).join('')}
</table>
<p class="footer">${transactions.length} transactions · Balance: ${formatRupiah(balance)}</p>
</body></html>`)
  win.document.close()
  win.print()
}

export default function AccountDetailPage() {
  const params = useParams()
  const { state, dispatch } = useFinanceStore()
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExport, setShowExport] = useState(false)

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--color-ink-2)' }}>Loading...</div>
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
    <AuthGuard>
      <div className="pb-24">
      <NavBar />

      <main className="section pt-20">
        {/* Back link + Export */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/accounts" className="inline-flex items-center gap-1.5 btn-ghost px-3 py-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" />
            All Accounts
          </Link>
          {accountTransactions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="btn-ghost px-3 py-1.5 text-sm"
              >
                <Download className="w-4 h-4" />
              </button>
              {showExport && (
                <>
                  <div className="absolute right-0 top-full mt-1 card p-1.5 min-w-[140px] z-10" style={{ background: 'var(--color-paper-0)' }}>
                    <button
                      onClick={() => { exportCSV(account.name, accountTransactions); setShowExport(false) }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={{ color: 'var(--color-ink-0)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => { exportPDF(account.name, accountTransactions, balance, income, expense); setShowExport(false) }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                      style={{ color: 'var(--color-ink-0)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="fixed inset-0 z-0" onClick={() => setShowExport(false)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Account Header Card */}
        <div className="balance-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${color}33` }}>
              <AcctIcon type={account.type} className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p className="mono-label">{account.type}</p>
              <p className="text-lg font-semibold mt-0.5">{account.name}</p>
            </div>
          </div>
          <p className="text-sm mb-1" style={{ opacity: 0.7 }}>Current Balance</p>
          <p className="text-3xl font-bold"><span className="italic-accent">{formatIDR(balance)}</span></p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--color-success) 15%, transparent)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              </div>
              <span className="mono-label">Income</span>
            </div>
            <p className="text-lg font-bold text-income">{formatIDR(income)}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklch, var(--color-warning) 15%, transparent)' }}>
                <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              </div>
              <span className="mono-label">Expense</span>
            </div>
            <p className="text-lg font-bold text-expense">{formatIDR(expense)}</p>
          </div>
        </div>

        {/* Mark as Settled for Loan accounts */}
        {account.type === 'Loan' && !account.isSettled && (
          <div className="card mb-6" style={{ borderColor: 'color-mix(in oklch, var(--color-success) 25%, transparent)', background: 'color-mix(in oklch, var(--color-paper-0) 95%, var(--color-success))' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink-0)' }}>Loan settled?</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-2)' }}>Mark this loan as fully paid. It will move to Loan History.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Mark this loan as settled? It will move to Loan History.')) {
                    dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...account, isSettled: true, settledAt: new Date().toISOString() } })
                  }
                }}
                className="btn-primary px-5 py-2.5 text-sm shrink-0"
              >
                <Check className="w-4 h-4" /> Settled
              </button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <section>
          <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)' }}>Transactions</h2>
          {accountTransactions.length === 0 ? (
            <div className="card text-center">
              <p style={{ color: 'var(--color-ink-2)', fontSize: 'var(--text-sm)' }}>No transactions for this account</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accountTransactions.map(tx => {
                const catColor = CATEGORY_COLORS[tx.category]
                return (
                  <button
                    key={tx.id}
                    onClick={() => openEdit(tx)}
                    className="w-full card flex items-center gap-3 hover:scale-[1.01] transition-all text-left"
                    style={{ padding: 'var(--space-md)' }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${catColor}33` }}>
                      <CatIcon category={tx.category} className="w-5 h-5" style={{ color: catColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink-0)' }}>{tx.title}</p>
                      <p className="mono-label text-[10px] mt-0.5">{tx.category} &middot; {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.isIncome ? 'text-income' : 'text-expense'}`}>
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
    </div>
    </AuthGuard>
  )
}
