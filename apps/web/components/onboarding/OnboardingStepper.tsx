'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

const steps = [
  { id: 'income', label: 'Income', href: '/onboarding/income' },
  { id: 'savings-debt', label: 'Savings & Debt', href: '/onboarding/savings-debt' },
  { id: 'goals', label: 'Goals', href: '/onboarding/goals' },
  { id: 'risk', label: 'Risk', href: '/onboarding/risk' },
  { id: 'review', label: 'Review', href: '/onboarding/review' },
]

export default function OnboardingStepper() {
  const pathname = usePathname()
  const currentIndex = Math.max(0, steps.findIndex((s) => pathname.startsWith(s.href)))

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const isLocked = index > currentIndex

          return (
            <div key={step.id} className="flex-1">
              <Link
                href={isLocked ? steps[currentIndex].href : step.href}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
                  isCurrent
                    ? 'bg-fintech-primary text-white border-fintech-primary'
                    : isDone
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 inline-flex items-center justify-center">{index + 1}</span>}
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            </div>
          )
        })}
      </div>
      <div className="mt-3">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fintech-secondary to-fintech-accent"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Takes ~2 minutes. You can edit later in Settings.</p>
      </div>
    </div>
  )
}

