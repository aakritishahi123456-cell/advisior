'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'
import {
  clearFinancialProfileDraft,
  FinancialProfileDraft,
  loadFinancialProfileDraft,
} from '@/lib/onboardingDraft'

function formatNpr(value?: number) {
  if (value === undefined) return '—'
  return `NPR ${value.toLocaleString()}`
}

export default function ReviewStepPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<FinancialProfileDraft>({})

  useEffect(() => {
    setDraft(loadFinancialProfileDraft())
  }, [])

  const handleBack = () => router.push('/onboarding/risk')

  const handleFinish = () => {
    clearFinancialProfileDraft()
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Review your profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Confirm details. FinSathi will use this to personalize insights and planning.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">Monthly income</p>
            <p className="font-bold text-gray-900 mt-1">{formatNpr(draft.incomeMonthly)}</p>
            <p className="text-xs text-gray-500 mt-1">Source: {draft.incomeSource || '—'}</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">Savings</p>
            <p className="font-bold text-gray-900 mt-1">{formatNpr(draft.savingsTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">Debt: {formatNpr(draft.debtTotal)}</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 sm:col-span-2">
            <p className="text-xs text-gray-500">Goals</p>
            <p className="font-bold text-gray-900 mt-1">{draft.goals?.length ? draft.goals.join(', ') : '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Risk tolerance: {draft.riskTolerance || '—'}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="btn btn-outline" onClick={handleBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleFinish}>
            Finish setup
          </button>
        </div>
      </div>
    </div>
  )
}

