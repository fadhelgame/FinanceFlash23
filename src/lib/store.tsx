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
  const stateRef = useRef(state)
  const savingRef = useRef(false)
  stateRef.current = state

  // Persist to localStorage synchronously on every state change
  useEffect(() => {
    if (!state.loaded) return
    const data = getFinanceData(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [state])

  // Fire Drive save in background on every change (no debounce)
  useEffect(() => {
    if (!state.loaded) return
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)

    const data = getFinanceData(state)
    import('./google-drive').then(m =>
      m.saveToDrive(data).then(() => {
        setSaving(false)
        savingRef.current = false
        setLastSaved(new Date().toLocaleTimeString('id-ID'))
      }).catch(() => {
        setSaving(false)
        savingRef.current = false
      })
    )
  }, [state])

  // Save on tab close / hide
  useEffect(() => {
    const handleSave = () => {
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

    // Merge: take the most recent data from each source
    // For each account/tx/recurring, keep the one with the most recent createdAt
    const merged: FinanceData = {
      accounts: [],
      transactions: [],
      recurringTransactions: [],
      lastUpdated: new Date().toISOString(),
    }

    const accountMap = new Map<string, Account>()
    const txMap = new Map<string, Transaction>()
    const recurringMap = new Map<string, RecurringTransaction>()

    for (const source of [driveData, localData]) {
      if (!source) continue
      for (const a of source.accounts || []) {
        const existing = accountMap.get(a.id)
        if (!existing || (a.createdAt || '') > (existing.createdAt || '')) {
          accountMap.set(a.id, a)
        }
      }
      for (const t of source.transactions || []) {
        const existing = txMap.get(t.id)
        if (!existing || (t.createdAt || '') > (existing.createdAt || '')) {
          txMap.set(t.id, t)
        }
      }
      for (const r of source.recurringTransactions || []) {
        const existing = recurringMap.get(r.id)
        if (!existing || (r.createdAt || '') > (existing.createdAt || '')) {
          recurringMap.set(r.id, r)
        }
      }
    }

    merged.accounts = Array.from(accountMap.values())
    merged.transactions = Array.from(txMap.values())
    merged.recurringTransactions = Array.from(recurringMap.values())

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

  const contextValue = useMemo(() => ({ state, dispatch, saveToDrive, loadFromSource, saving, lastSaved }), [state, dispatch, saveToDrive, loadFromSource, saving, lastSaved])

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
