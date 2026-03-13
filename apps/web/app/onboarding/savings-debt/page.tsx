'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'
import { loadFinancialProfileDraft, saveFinancialProfileDraft } from '@/lib/onboardingDraft'

export default function SavingsDebtStepPage() {
  const router = useRouter()
  const [savingsTotal, setSavingsTotal] = useState<number>(1500000)
  const [debtTotal, setDebtTotal] = useState<number>(500000)

  useEffect(() => {
    const draft = loadFinancialProfileDraft()
    if (draft.savingsTotal !== undefined) setSavingsTotal(draft.savingsTotal)
    if (draft.debtTotal !== undefined) setDebtTotal(draft.debtTotal)
  }, [])

  const handleBack = () => router.push('/onboarding/income')

  const handleNext = () => {
    const draft = loadFinancialProfileDraft()
    saveFinancialProfileDraft({ ...draft, savingsTotal, debtTotal })
    router.push('/onboarding/goals')
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Savings and debt</h1>
        <p className="text-sm text-gray-500 mt-1">
          This helps calculate your financial health score and suggested allocations.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="form-label">Total savings (NPR)</label>
            <input
              className="form-input"
              type="number"
              min={0}
              value={savingsTotal}
              onChange={(e) => setSavingsTotal(Number(e.target.value))}
              placeholder="e.g. 1500000"
            />
            <p className="text-xs text-gray-500 mt-1">Include cash, fixed deposits, and liquid funds.</p>
          </div>
          <div>
            <label className="form-label">Total debt (NPR)</label>
            <input
              className="form-input"
              type="number"
              min={0}
              value={debtTotal}
              onChange={(e) => setDebtTotal(Number(e.target.value))}
              placeholder="e.g. 500000"
            />
            <p className="text-xs text-gray-500 mt-1">Include loans, credit card balance, and EMIs.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="btn btn-outline" onClick={handleBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

