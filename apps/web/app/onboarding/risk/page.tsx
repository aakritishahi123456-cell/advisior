'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'
import { loadFinancialProfileDraft, saveFinancialProfileDraft } from '@/lib/onboardingDraft'

type Risk = 'CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE'

const options: Array<{ id: Risk; title: string; description: string }> = [
  { id: 'CONSERVATIVE', title: 'Conservative', description: 'Prefer stability; avoid big drawdowns.' },
  { id: 'BALANCED', title: 'Balanced', description: 'Mix of growth and safety; moderate volatility.' },
  { id: 'GROWTH', title: 'Growth', description: 'Higher returns with higher swings; long horizon.' },
  { id: 'AGGRESSIVE', title: 'Aggressive', description: 'Comfortable with large fluctuations for maximum growth.' },
]

export default function RiskStepPage() {
  const router = useRouter()
  const [riskTolerance, setRiskTolerance] = useState<Risk>('BALANCED')

  useEffect(() => {
    const draft = loadFinancialProfileDraft()
    if (draft.riskTolerance) setRiskTolerance(draft.riskTolerance as Risk)
  }, [])

  const handleBack = () => router.push('/onboarding/goals')

  const handleNext = () => {
    const draft = loadFinancialProfileDraft()
    saveFinancialProfileDraft({ ...draft, riskTolerance })
    router.push('/onboarding/review')
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Risk tolerance</h1>
        <p className="text-sm text-gray-500 mt-1">
          This helps FinSathi recommend the right portfolio allocation.
        </p>

        <div className="mt-6 space-y-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRiskTolerance(opt.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                riskTolerance === opt.id ? 'border-fintech-secondary bg-fintech-secondary/5' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    riskTolerance === opt.id ? 'border-fintech-secondary' : 'border-gray-300'
                  }`}
                >
                  {riskTolerance === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-fintech-secondary" />}
                </div>
              </div>
            </button>
          ))}
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

