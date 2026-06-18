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

export function CatIcon({ category, className, style }: { category: TransactionCategory; className?: string; style?: React.CSSProperties }) {
  const props = { className: className || 'w-5 h-5', style: style || {} }
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

export function AcctIcon({ type, className, style }: { type: AccountType; className?: string; style?: React.CSSProperties }) {
  const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    banknote: Banknote, building: Wallet, 'credit-card': CreditCard,
    'arrow-left-right': ArrowLeftRight, smartphone: Smartphone, shield: Shield,
  }
  const iconName = ({ Cash: 'banknote', Bank: 'building', 'Credit Card': 'credit-card', Loan: 'arrow-left-right', 'E-Wallet': 'smartphone', Savings: 'shield' } as Record<AccountType, string>)[type]
  const Icon = icons[iconName] || Wallet
  return <Icon className={className || 'w-5 h-5'} style={style || { color: '#fff' }} />
}
