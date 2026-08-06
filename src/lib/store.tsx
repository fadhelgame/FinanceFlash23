'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import type { Account, Transaction, RecurringTransaction, FinanceData } from './types'
import { processRecurring } from './types'

interface FinanceState {
  accounts: Account[]
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  // When the data itself last changed — not when it was last serialised. The
  // cross-device merge picks the freshest snapshot by this value, so stamping it
  // on any write would let a device that merely opened the app claim to hold
  // newer data than the device that actually edited something.
  lastUpdated: string
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
  const next = applyAction(state, action)
  // SET_DATA adopts a snapshot wholesale and must keep that snapshot's own
  // timestamp. Every other action is a real edit, so it advances the clock.
  if (action.type === 'SET_DATA' || next === state) return next
  return { ...next, lastUpdated: new Date().toISOString() }
}

function applyAction(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        ...action.payload,
        lastUpdated: action.payload.lastUpdated || state.lastUpdated,
        loaded: true,
      }
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

const STORAGE_KEY = 'finance-flash-data-v2'
const LEGACY_STORAGE_KEY = 'finance-flash-data'

// Don't re-pull on every quick tab switch, but do pull when the app has been in
// the background long enough for another device to have changed something.
const REFRESH_ON_FOCUS_MS = 30_000

function getFinanceData(state: FinanceState): FinanceData {
  return {
    accounts: state.accounts,
    transactions: state.transactions,
    recurringTransactions: state.recurringTransactions,
    lastUpdated: state.lastUpdated,
  }
}

function hasData(data: FinanceData | null | undefined): boolean {
  if (!data) return false
  return (
    (data.accounts?.length ?? 0) > 0 ||
    (data.transactions?.length ?? 0) > 0 ||
    (data.recurringTransactions?.length ?? 0) > 0
  )
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    accounts: [],
    transactions: [],
    recurringTransactions: [],
    lastUpdated: '',
    loaded: false,
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isDemoMode, setDemoMode] = useState(false)
  const stateRef = useRef(state)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const demoModeRef = useRef(false)
  // True when a remote source failed to answer during load. While degraded we
  // hold no authoritative snapshot, so an empty state is meaningless and must
  // never be written back over the real data.
  const loadDegradedRef = useRef(true)
  // The optimistic cache render happens before the remote sources have been
  // consulted, so its state is not yet authoritative. No remote write may
  // happen until loadFromSource has reconciled everything.
  const syncReadyRef = useRef(false)
  const lastLoadAtRef = useRef(0)
  // Held in a ref so the visibility listener can call the latest version
  // without re-subscribing on every render.
  const loadFromSourceRef = useRef<(() => Promise<void>) | null>(null)

  // Mirror state into refs after commit, so the unload handler and the batch
  // interval can read the latest values without re-subscribing.
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    demoModeRef.current = isDemoMode
  }, [isDemoMode])

  // An empty payload is only safe to persist when we know the emptiness is real
  // — i.e. the load phase completed against every source without errors.
  const canPersistRemote = useCallback((data: FinanceData): boolean => {
    if (!syncReadyRef.current) return false
    if (hasData(data)) return true
    if (loadDegradedRef.current) {
      console.warn('Skipping remote save of empty state — load was degraded')
      return false
    }
    return true
  }, [])

  // Persist to localStorage synchronously on every state change
  useEffect(() => {
    if (!state.loaded) return
    const data = getFinanceData(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [state])

  // Sync to Turso on change, debounced so a burst of edits is one write
  useEffect(() => {
    if (!state.loaded) return
    if (isDemoMode) return

    const data = getFinanceData(state)
    if (!canPersistRemote(data)) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const email = document.cookie.match(/google_email=([^;]+)/)?.[1]
      if (email) {
        fetch('/api/turso/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: decodeURIComponent(email),
            data,
            // Only vouch for an empty payload when the load phase was clean.
            allowEmpty: !loadDegradedRef.current,
          }),
        }).catch(() => {})
      }
      setLastSaved(new Date().toLocaleTimeString('id-ID'))
    }, 800)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state, isDemoMode, canPersistRemote])

  // Batch sync to Drive every 5 minutes
  useEffect(() => {
    if (!state.loaded || isDemoMode) return

    const interval = setInterval(async () => {
      try {
        const { saveToDrive: apiSave } = await import('./google-drive')
        const data = getFinanceData(stateRef.current)
        // Only sync if we have data
        if (hasData(data)) {
          setSaving(true)
          await apiSave(data)
          setSaving(false)
        }
      } catch {
        setSaving(false)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [state.loaded, isDemoMode])

  // Save on tab close / hide
  useEffect(() => {
    const handleSave = () => {
      if (demoModeRef.current) return
      const data = getFinanceData(stateRef.current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (!canPersistRemote(data)) return

      // Flush the debounced Turso write — the page may not survive long enough
      // for a normal fetch, so hand it to the browser to deliver.
      const email = document.cookie.match(/google_email=([^;]+)/)?.[1]
      if (email) {
        const body = JSON.stringify({
          email: decodeURIComponent(email),
          data,
          allowEmpty: !loadDegradedRef.current,
        })
        navigator.sendBeacon(
          '/api/turso/save',
          new Blob([body], { type: 'application/json' })
        )
      }

      import('./google-drive').then(m =>
        m.saveToDrive(data, !loadDegradedRef.current).catch(() => {})
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSave()
        return
      }
      // Coming back into view: pull before anything here can push. A tab left
      // open for hours otherwise holds a snapshot from before the phone's edits
      // and overwrites them on its next save.
      if (Date.now() - lastLoadAtRef.current > REFRESH_ON_FOCUS_MS) {
        loadFromSourceRef.current?.()
      }
    }

    window.addEventListener('beforeunload', handleSave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [canPersistRemote])

  // Load from every source and keep the freshest snapshot that actually holds
  // data. No single source is "the" source of truth — any of them can be stale
  // or briefly unreachable, and losing to an unreachable one costs real data.
  const loadFromSource = useCallback(async () => {
    let driveData: FinanceData | null = null
    let tursoData: FinanceData | null = null
    let localData: FinanceData | null = null
    let degraded = false

    const email = document.cookie.match(/google_email=([^;]+)/)?.[1]

    // localStorage is instant and already on the device, so read it first and
    // paint with it. Waiting on two network round-trips before showing anything
    // is the difference between an app that opens and one that hangs.
    try {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        localData = JSON.parse(local)
      } else {
        // Caches written before lastUpdated became an edit timestamp carry a
        // serialisation time instead, which can look newer than remote data
        // that is genuinely more recent. Keep the records, discard the claim.
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacy) {
          localData = { ...JSON.parse(legacy), lastUpdated: '' }
        }
      }
    } catch {
      console.warn('localStorage read failed');
    }
    if (hasData(localData)) {
      dispatch({ type: 'SET_DATA', payload: localData! })
    }

    // Drive and Turso are independent — asking them one after the other doubled
    // the wait for no reason.
    const [driveResult, tursoResult] = await Promise.allSettled([
      import('./google-drive').then(m => m.loadFromDrive<FinanceData>()),
      email
        ? fetch(`/api/turso/load?email=${encodeURIComponent(decodeURIComponent(email))}`).then(
            async res => {
              if (!res.ok) throw new Error(`turso load ${res.status}`)
              const json = await res.json()
              return Array.isArray(json?.accounts) ? (json as FinanceData) : null
            }
          )
        : Promise.resolve(null),
    ])

    if (driveResult.status === 'fulfilled') {
      driveData = driveResult.value
    } else {
      degraded = true
      console.warn('Drive load failed — treating as unavailable, not as empty')
    }

    if (tursoResult.status === 'fulfilled') {
      tursoData = tursoResult.value
    } else {
      degraded = true
      console.warn('Turso load failed — treating as unavailable, not as empty')
    }

    // Turso is written on every edit; Drive only every five minutes and on
    // unload. So Drive is structurally behind, and letting a timestamp
    // comparison hand it the win loses whatever happened in between.
    const remote: FinanceData | null = hasData(tursoData)
      ? tursoData
      : hasData(driveData)
        ? driveData
        : null

    // The local cache only wins when it genuinely holds newer edits — offline
    // changes that have not reached either remote yet.
    const localIsNewer =
      hasData(localData) &&
      (!remote ||
        (Date.parse(localData!.lastUpdated ?? '') || 0) >
          (Date.parse(remote.lastUpdated ?? '') || 0))

    const merged: FinanceData = (localIsNewer ? localData : remote) ?? {
      accounts: [],
      transactions: [],
      recurringTransactions: [],
      lastUpdated: new Date().toISOString(),
    }

    // Only unlock empty remote writes once every source answered cleanly.
    loadDegradedRef.current = degraded

    // Keep the local cache aligned with whatever won, so a stale cache never
    // resurfaces later as the freshest candidate.
    if (hasData(merged)) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
    }

    if (hasData(merged)) {
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

    // Reconciliation is done — the state on screen is now authoritative and may
    // be written back.
    syncReadyRef.current = true
    lastLoadAtRef.current = Date.now()
  }, [])

  // Manual save function with feedback
  const saveToDrive = useCallback(async (): Promise<boolean> => {
    if (demoModeRef.current) return false
    try {
      setSaving(true)
      const data = getFinanceData(stateRef.current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (!canPersistRemote(data)) {
        setSaving(false)
        return false
      }
      const { saveToDrive: apiSave } = await import('./google-drive')
      await apiSave(data, !loadDegradedRef.current)
      setLastSaved(new Date().toLocaleTimeString('id-ID'))
      setSaving(false)
      return true
    } catch {
      setSaving(false)
      return false
    }
  }, [canPersistRemote])

  useEffect(() => {
    loadFromSourceRef.current = loadFromSource
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
