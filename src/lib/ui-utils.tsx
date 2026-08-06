import React from 'react'
import type { AccountType, TransactionCategory } from './types'
import {
  Banknote, Wallet, ArrowLeftRight, CreditCard, Smartphone, Shield,
  ForkKnife, Car, ShoppingBag, Gamepad2, FileText, Heart, Ellipsis, TrendingUp,
} from 'lucide-react'

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Bills: '#ef4444',
  Salary: '#22c55e',
  Health: '#14b8a6',
  Other: '#6b7280',
}

const EMPTY_STYLE: React.CSSProperties = {}

export function CatIcon({ category, className, style }: { category: TransactionCategory; className?: string; style?: React.CSSProperties }) {
  const props = { className: className || 'w-5 h-5', style: style || EMPTY_STYLE }
  switch (category) {
    case 'Food': return <ForkKnife {...props} />
    case 'Transport': return <Car {...props} />
    case 'Shopping': return <ShoppingBag {...props} />
    case 'Entertainment': return <Gamepad2 {...props} />
    case 'Bills': return <FileText {...props} />
    case 'Salary': return <TrendingUp {...props} />
    case 'Health': return <Heart {...props} />
    default: return <Ellipsis {...props} />
  }
}

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  Cash: '#22c55e',
  Bank: '#3b82f6',
  'Credit Card': '#f97316',
  Loan: '#ef4444',
  'E-Wallet': '#a855f7',
  Savings: '#14b8a6',
}

// Hoisted: these were rebuilt on every call, and AcctIcon renders once per
// account card, per chip and per row.
const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Cash: Banknote,
  Bank: Wallet,
  'Credit Card': CreditCard,
  Loan: ArrowLeftRight,
  'E-Wallet': Smartphone,
  Savings: Shield,
}

const DEFAULT_ICON_STYLE: React.CSSProperties = { color: '#fff' }

export function AcctIcon({ type, className, style }: { type: AccountType; className?: string; style?: React.CSSProperties }) {
  const Icon = ACCOUNT_TYPE_ICONS[type] || Wallet
  return <Icon className={className || 'w-5 h-5'} style={style || DEFAULT_ICON_STYLE} />
}
