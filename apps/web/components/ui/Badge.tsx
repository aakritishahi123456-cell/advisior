'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'sm', className = '', ...props }, ref) => {
    const variants = {
      default: 'bg-surface-tertiary text-text-secondary',
      success: 'bg-gains-100 text-gains-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-losses-100 text-losses-700',
      info: 'bg-blue-100 text-blue-700',
      premium: 'bg-gradient-to-r from-fintech-secondary to-fintech-accent text-white',
    }

    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-semibold rounded-full
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
export type { BadgeProps }
