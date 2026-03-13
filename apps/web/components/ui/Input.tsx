'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-text-primary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full px-4 py-3 rounded-xl border bg-surface-primary
              text-text-primary placeholder:text-text-tertiary
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-fintech-secondary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon || isPassword ? 'pr-12' : ''}
              ${error ? 'border-losses focus:ring-losses' : 'border-border hover:border-border-dark'}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-losses">{error}</p>}
        {hint && !error && <p className="mt-2 text-sm text-text-tertiary">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
export type { InputProps }
