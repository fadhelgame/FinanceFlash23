'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'btn btn-primary',
  outline:
    'bg-transparent border border-[color-mix(in_oklch,var(--color-ink-0)_16%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-ink-0)_6%,transparent)] rounded-full',
  ghost: 'bg-transparent border-none hover:bg-[color-mix(in_oklch,var(--color-ink-0)_6%,transparent)]',
} as const

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-11 px-8',
  icon: 'h-9 w-9',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
