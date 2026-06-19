'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import type { Account, Transaction, RecurringTransaction, FinanceData } from './types'
import { processRecurring, generateId } from './types'

interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  loaded: boolean
}

type Action =
  | { type: 'SET_DATA'; payload: FinanceData }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'ADD_MULTIPLE_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_MULTIPLE_RECURRING'; payload: RecurringTransaction[] }

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload, loaded: true }
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] }
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
    case 'ADD_RECURRING':
      return { ...state, recurringTransactions: [...state.recurringTransactions, action.payload] }
    case 'UPDATE_RECURRING':
      return { ...state, recurringTransactions: state.recurringTransactions.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_RECURRING':
      return { ...state, recurringTransactions: state.recurringTransactions.filter(r => r.id !== action.payload) }
    case 'ADD_MULTIPLE_TRANSACTIONS':
      return { ...state, transactions: [...action.payload, ...state.transactions] }
    case 'UPDATE_MULTIPLE_RECURRING':
      return { 
        ...state, 
        recurringTransactions: state.recurringTransactions.map(
          r => action.payload.find(ur => ur.id === r.id) || r
        )
      }
    default:
      return state
  }
}

const FinanceContext = createContext<{
  state: FinanceState
  dispatch: React.Dispatch<Action>
  saveToDrive: () => Promise<boolean>
  loadFromSource: () => Promise<void>
  saving: boolean
  lastSaved: string | null
  isDemoMode: boolean
  setDemoMode: (v: boolean) => void
} | null>(null)

const STORAGE_KEY = 'finance-flash-data'

function getFinanceData(state: FinanceState): FinanceData {
  return {
    accounts: state.accounts,
    transactions: state.transactions,
    recurringTransactions: state.recurringTransactions,
    lastUpdated: new Date().toISOString(),
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    accounts: [],
    transactions: [],
    recurringTransactions: [],
    loaded: false,
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isDemoMode, setDemoMode] = useState(false)
  const stateRef = useRef(state)
  const savingRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const demoModeRef = useRef(false)
  stateRef.current = state
  demoModeRef.current = isDemoMode

  // Persist to localStorage synchronously on every state change
  useEffect(() => {
    if (!state.loaded) return
    const data = getFinanceData(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [state])

  // Fire Turso save in background on every change (fire-and-forget)
  const tursoTimerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!state.loaded) return
    if (isDemoMode) return

    const data = getFinanceData(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // Fire-and-forget Turso save (no debounce — Turso is fast)
    import('./turso').then(m => {
      const email = document.cookie.match(/google_email=([^;]+)/)?.[1]
      if (email) {
        fetch('/api/turso/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: decodeURIComponent(email), data }),
        }).catch(() => {})
      }
    }).catch(() => {})

    setLastSaved(new Date().toLocaleTimeString('id-ID'))
  }, [state])

  // Batch sync to Drive every 5 minutes
  useEffect(() => {
    if (!state.loaded || isDemoMode) return

    const interval = setInterval(async () => {
      try {
        const { saveToDrive: apiSave } = await import('./google-drive')
        const data = getFinanceData(stateRef.current)
        // Only sync if we have data
        if (data.accounts.length > 0 || data.transactions.length > 0 || data.recurringTransactions.length > 0) {
          setSaving(true)
          await apiSave(data)
          setSaving(false)
        }
      } catch {
        setSaving(false)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [state.loaded])

  // Save on tab close / hide
  useEffect(() => {
    const handleSave = () => {
      if (demoModeRef.current) return
      const data = getFinanceData(stateRef.current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      import('./google-drive').then(m =>
        m.saveToDrive(data).catch(() => {})
      )
    }

    window.addEventListener('beforeunload', handleSave)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSave()
      }
    })

    return () => {
      window.removeEventListener('beforeunload', handleSave)
      document.removeEventListener('visibilitychange', handleSave)
    }
  }, [])

  // Merge data on load — take the latest version from either source
  const loadFromSource = useCallback(async () => {
    let driveData: FinanceData | null = null
    let localData: FinanceData | null = null

    // Try Drive
    try {
      const { loadFromDrive } = await import('./google-drive')
      driveData = await loadFromDrive<FinanceData>()
    } catch {
      console.warn('Drive load unavailable, using local data');
    }

    // Try localStorage
    try {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        localData = JSON.parse(local)
      }
    } catch {
      console.warn('localStorage read failed');
    }

    // Merge: take the most recent data from Drive (source of truth)
    // localStorage is just a cache — Drive wins always
    const merged: FinanceData = driveData
      ? { ...driveData }
      : localData
        ? { ...localData }
        : {
            accounts: [],
            transactions: [],
            recurringTransactions: [],
            lastUpdated: new Date().toISOString(),
          }

    // If Drive was available, overwrite localStorage with its data
    // so stale demo cache never pollutes
    if (driveData) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(driveData)) } catch {}
    }

    if (merged.accounts.length > 0 || merged.transactions.length > 0 || merged.recurringTransactions.length > 0) {
      const { newTransactions, updatedRecurring } = processRecurring(
        merged.recurringTransactions || [],
        merged.transactions || []
      )
      dispatch({ type: 'SET_DATA', payload: merged })
      if (newTransactions.length > 0) {
        dispatch({ type: 'ADD_MULTIPLE_TRANSACTIONS', payload: newTransactions })
      }
      if (updatedRecurring.length > 0) {
        dispatch({ type: 'UPDATE_MULTIPLE_RECURRING', payload: updatedRecurring })
      }
    } else {
      dispatch({ type: 'SET_DATA', payload: { accounts: [], transactions: [], recurringTransactions: [], lastUpdated: new Date().toISOString() } })
    }
  }, [])

  // Manual save function with feedback
  const saveToDrive = useCallback(async (): Promise<boolean> => {
    if (demoModeRef.current) return false
    try {
      setSaving(true)
      const data = getFinanceData(stateRef.current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      const { saveToDrive: apiSave } = await import('./google-drive')
      await apiSave(data)
      setLastSaved(new Date().toLocaleTimeString('id-ID'))
      setSaving(false)
      return true
    } catch {
      setSaving(false)
      return false
    }
  }, [])

  useEffect(() => {
    loadFromSource()
  }, [loadFromSource])

  const contextValue = useMemo(() => ({ state, dispatch, saveToDrive, loadFromSource, saving, lastSaved, isDemoMode, setDemoMode }), [state, dispatch, saveToDrive, loadFromSource, saving, lastSaved, isDemoMode, setDemoMode])

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceStore() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinanceStore must be used within FinanceProvider')
  return ctx
}
