'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'
import { loadFinancialProfileDraft, saveFinancialProfileDraft } from '@/lib/onboardingDraft'

export default function IncomeStepPage() {
  const router = useRouter()
  const [incomeMonthly, setIncomeMonthly] = useState<number>(120000)
  const [incomeSource, setIncomeSource] = useState<'SALARY' | 'BUSINESS' | 'FREELANCE' | 'RENTAL' | 'OTHER'>('SALARY')

  useEffect(() => {
    const draft = loadFinancialProfileDraft()
    if (draft.incomeMonthly) setIncomeMonthly(draft.incomeMonthly)
    if (draft.incomeSource) setIncomeSource(draft.incomeSource)
  }, [])

  const handleNext = () => {
    const draft = loadFinancialProfileDraft()
    saveFinancialProfileDraft({ ...draft, incomeMonthly, incomeSource })
    router.push('/onboarding/savings-debt')
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Income information</h1>
        <p className="text-sm text-gray-500 mt-1">
          This helps FinSathi tailor loan eligibility and investment plans to you.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="form-label">Monthly income (NPR)</label>
            <input
              className="form-input"
              type="number"
              min={0}
              value={incomeMonthly}
              onChange={(e) => setIncomeMonthly(Number(e.target.value))}
              placeholder="e.g. 120000"
            />
            <p className="text-xs text-gray-500 mt-1">Use your after‑tax average, if possible.</p>
          </div>
          <div>
            <label className="form-label">Primary income source</label>
            <select className="form-input" value={incomeSource} onChange={(e) => setIncomeSource(e.target.value as any)}>
              <option value="SALARY">Salary</option>
              <option value="BUSINESS">Business</option>
              <option value="FREELANCE">Freelance</option>
              <option value="RENTAL">Rental</option>
              <option value="OTHER">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Used to estimate stability and risk capacity.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="btn btn-outline" onClick={() => router.push('/dashboard')}>
            Skip for now
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Continue
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        FinSathi AI uses this information to generate insights. You can update it any time in Settings.
      </div>
    </div>
  )
}

