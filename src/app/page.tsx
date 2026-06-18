'use client'

import { useAuth } from '@/lib/auth-context'
import { useFinanceStore } from '@/lib/store'
import dynamic from 'next/dynamic'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useState, useRef } from 'react'
import type { Transaction } from '@/lib/types'
import { Plus } from 'lucide-react'
import { demoData } from '@/lib/demo-data'

const LandingPage = dynamic(() => import('@/components/LandingPage'), { ssr: false })
const DashboardView = dynamic(() => import('@/components/DashboardView'), { ssr: false })

export default function DashboardPage() {
  const { isAuthenticated, loading, userEmail, login } = useAuth()
  const { state, dispatch, isDemoMode, setDemoMode } = useFinanceStore()
  const [showTxModal, setShowTxModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const demoInjectedRef = useRef(false)

  const handleDemo = () => {
    if (!demoInjectedRef.current) {
      dispatch({ type: 'SET_DATA', payload: { ...demoData, lastUpdated: new Date().toISOString() } })
      setDemoMode(true)
      demoInjectedRef.current = true
    }
  }

  const handleExitDemo = () => {
    setDemoMode(false)
    demoInjectedRef.current = false
    dispatch({ type: 'SET_DATA', payload: { accounts: [], transactions: [], recurringTransactions: [], lastUpdated: '' } })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--color-ink-2)' }}>Loading...</div>
      </div>
    )
  }

  // Show dashboard in demo mode regardless of auth
  if (isDemoMode || isAuthenticated) {
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
          isDemoMode={isDemoMode}
          onExitDemo={handleExitDemo}
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

  return <LandingPage login={login} onDemo={handleDemo} />
}
