'use client'

import { useAuth } from '@/lib/auth-context'
import { useFinanceStore } from '@/lib/store'
import LandingPage from '@/components/LandingPage'
import DashboardView from '@/components/DashboardView'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useState } from 'react'
import type { Transaction } from '@/lib/types'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const { isAuthenticated, loading, userEmail, login } = useAuth()
  const { state, dispatch } = useFinanceStore()
  const [showTxModal, setShowTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--color-ink-2)' }}>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage login={login} />
  }

  const handleSaveTx = (tx: Transaction) => {
    if (editingTx) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: tx })
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: tx })
    }
    setEditingTx(null)
    setShowTxModal(false)
  }

  return (
    <>
      <DashboardView
        state={state}
        dispatch={dispatch}
        userEmail={userEmail}
        onEditTx={(tx) => { setEditingTx(tx); setShowTxModal(true) }}
        onAddTx={() => { setEditingTx(null); setShowTxModal(true) }}
      />
      <AddTransactionModal
        open={showTxModal}
        onClose={() => { setShowTxModal(false); setEditingTx(null) }}
        onSave={handleSaveTx}
        initial={editingTx}
      />
    </>
  )
}
