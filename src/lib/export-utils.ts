import type { Transaction, RecurringTransaction } from '@/lib/types'
import { formatIDR, CATEGORIES, generateId } from '@/lib/types'
import type { Account } from '@/lib/types'

/* ---------- Export / ---------- */

function exportCSV(transactions: Transaction[]) {
  const rows = [['Title', 'Amount', 'Category', 'Date', 'Type', 'Account ID']]
  for (const t of transactions) {
    rows.push([t.title, String(t.amount), t.category, t.date, t.isIncome ? 'Income' : 'Expense', t.accountId || ''])
  }
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-flash-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(transactions: Transaction[]) {
  // Simple printable view
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><title>Finance Flash Export</title>
    <style>
      body { font-family: Inter, sans-serif; background:#fff; color:#111; padding:40px; }
      h1 { font-size:24px; margin-bottom:8px; }
      .meta { color:#666; margin-bottom:24px; }
      table { width:100%; border-collapse:collapse; }
      th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #eee; font-size:14px; }
      th { background:#f5f5f5; font-weight:600; }
      .income { color:#16a34a; } .expense { color:#dc2626; }
    </style></head><body>
    <h1>Finance Flash</h1>
    <p class="meta">Exported ${new Date().toLocaleDateString()} — ${transactions.length} transactions</p>
    <table><thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>
    ${transactions.map(t => `<tr><td>${t.title}</td><td>${t.category}</td><td>${new Date(t.date).toLocaleDateString()}</td><td>${t.isIncome ? 'Income' : 'Expense'}</td><td class="${t.isIncome ? 'income' : 'expense'}">${formatIDR(t.amount)}</td></tr>`).join('')}
    </tbody></table></body></html>
  `)
  win.document.close()
  win.print()
}

/* ---------- JSON Export / Import ---------- */

function exportJSON(state: { accounts: Account[]; transactions: Transaction[]; recurringTransactions: RecurringTransaction[] }) {
  const data = {
    accounts: state.accounts,
    transactions: state.transactions,
    recurringTransactions: state.recurringTransactions,
    lastUpdated: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-flash-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON(event: React.ChangeEvent<HTMLInputElement>, dispatch: React.Dispatch<any>) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (!data.accounts && !data.transactions && !data.recurringTransactions) {
        alert('Invalid backup file. Expected Finance Flash JSON backup.')
        return
      }
      const count = (data.accounts?.length || 0) + (data.transactions?.length || 0) + (data.recurringTransactions?.length || 0)
      if (confirm(`This will replace ALL current data with ${count} items from the backup.\n\nCurrent data will be lost. Continue?`)) {
        dispatch({ type: 'SET_DATA', payload: { ...data, lastUpdated: new Date().toISOString() } })
        alert(`Restored ${count} items successfully!`)
      }
    } catch {
      alert('Invalid JSON file. Please select a valid Finance Flash backup.')
    }
  }
  reader.readAsText(file)
  // Reset so the same file can be selected again
  event.target.value = ''
}

function importCSV(event: React.ChangeEvent<HTMLInputElement>, dispatch: React.Dispatch<any>) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        alert('CSV file must have a header row and at least one data row.')
        return
      }
      const header = lines[0].toLowerCase()
      if (!header.includes('title') || !header.includes('amount')) {
        alert('CSV must have at least Title and Amount columns.')
        return
      }

      const cols = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/\"/g, ''))
      const titleIdx = cols.findIndex(c => c === 'title')
      const amountIdx = cols.findIndex(c => c === 'amount')
      const catIdx = cols.findIndex(c => c === 'category')
      const dateIdx = cols.findIndex(c => c === 'date')
      const typeIdx = cols.findIndex(c => c === 'type')
      const accountIdIdx = cols.findIndex(c => c === 'account id')

      const parsed: Transaction[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const amount = parseInt(vals[amountIdx]?.replace(/[^0-9-]/g, '') || '0', 10)
        if (!amount || isNaN(amount)) continue
                    const isIncome = vals[typeIdx]?.toLowerCase() === 'income'
        const accountId = accountIdIdx >= 0 ? (vals[accountIdIdx] || null) : null
        parsed.push({
          id: generateId(),
          title: vals[titleIdx] || 'Imported',
          amount: Math.abs(amount),
          category: (vals[catIdx] as any) || 'Other',
          date: vals[dateIdx] || new Date().toISOString().slice(0, 10),
          isIncome,
          accountId,
          createdAt: new Date().toISOString(),
        })
      }

      if (parsed.length === 0) {
        alert('No valid transactions found in the CSV.')
        return
      }

      if (confirm(`Add ${parsed.length} transaction${parsed.length > 1 ? 's' : ''} from CSV?`)) {
        for (const tx of parsed) {
          dispatch({ type: 'ADD_TRANSACTION', payload: tx })
        }
        alert(`Imported ${parsed.length} transaction${parsed.length > 1 ? 's' : ''}!`)
      }
    } catch {
      alert('Failed to parse CSV. Make sure it matches the export format.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

export { exportCSV, exportPDF, exportJSON, importJSON, importCSV }
