'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl transition-all duration-300'

    const variants = {
      default: 'bg-surface-primary border border-border shadow-card',
      elevated: 'bg-surface-elevated shadow-elevated',
      outlined: 'bg-transparent border border-border',
      gradient: 'bg-card-gradient border border-border shadow-card',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverStyles = hover
      ? 'hover:shadow-premium hover:-translate-y-1 cursor-pointer'
      : ''

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
export type { CardProps }
