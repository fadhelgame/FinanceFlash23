'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
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
  saveToDrive: () => Promise<void>
  loadFromSource: () => Promise<void>
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveToDrive = useCallback(async () => {
    const data = getFinanceData(state)
    // Save to localStorage always
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    
    // Try Drive save if available
    try {
      const { saveToDrive: apiSave } = await import('./google-drive')
      await apiSave(data)
    } catch {
      // Drive not configured yet — that's fine
    }
  }, [state])

  // Auto-save debounced
  useEffect(() => {
    if (!state.loaded) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const data = getFinanceData(state)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      
      // Try Drive save in background
      import('./google-drive').then(m => 
        m.saveToDrive(data).catch(() => {})
      )
    }, 2000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state])

  const loadFromSource = useCallback(async () => {
    // Try Google Drive first
    try {
      const { loadFromDrive } = await import('./google-drive')
      const driveData = await loadFromDrive<FinanceData>()
      if (driveData && driveData.accounts) {
        // Process recurring
        const { newTransactions, updatedRecurring } = processRecurring(
          driveData.recurringTransactions || [],
          driveData.transactions || []
        )
        dispatch({ type: 'SET_DATA', payload: driveData })
        if (newTransactions.length > 0) {
          dispatch({ type: 'ADD_MULTIPLE_TRANSACTIONS', payload: newTransactions })
        }
        if (updatedRecurring.length > 0) {
          dispatch({ type: 'UPDATE_MULTIPLE_RECURRING', payload: updatedRecurring })
        }
        return
      }
    } catch {
      // Drive not available, fall through to localStorage
    }

    // Fallback to localStorage
    try {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        const data: FinanceData = JSON.parse(local)
        const { newTransactions, updatedRecurring } = processRecurring(
          data.recurringTransactions || [],
          data.transactions || []
        )
        dispatch({ type: 'SET_DATA', payload: data })
        if (newTransactions.length > 0) {
          dispatch({ type: 'ADD_MULTIPLE_TRANSACTIONS', payload: newTransactions })
        }
        if (updatedRecurring.length > 0) {
          dispatch({ type: 'UPDATE_MULTIPLE_RECURRING', payload: updatedRecurring })
        }
      } else {
        dispatch({ type: 'SET_DATA', payload: { accounts: [], transactions: [], recurringTransactions: [], lastUpdated: new Date().toISOString() } })
      }
    } catch {
      dispatch({ type: 'SET_DATA', payload: { accounts: [], transactions: [], recurringTransactions: [], lastUpdated: new Date().toISOString() } })
    }
  }, [])

  useEffect(() => {
    loadFromSource()
  }, [loadFromSource])

  return (
    <FinanceContext.Provider value={{ state, dispatch, saveToDrive, loadFromSource }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinanceStore() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinanceStore must be used within FinanceProvider')
  return ctx
}
