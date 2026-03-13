'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'
import { loadFinancialProfileDraft, saveFinancialProfileDraft } from '@/lib/onboardingDraft'

type Goal = 'RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'WEALTH_GROWTH' | 'EMERGENCY_FUND'

const options: Array<{ id: Goal; title: string; description: string }> = [
  { id: 'WEALTH_GROWTH', title: 'Wealth growth', description: 'Grow investments for long‑term returns.' },
  { id: 'RETIREMENT', title: 'Retirement planning', description: 'Build a retirement corpus with monthly SIPs.' },
  { id: 'HOUSE', title: 'Buy a home', description: 'Plan down‑payment and loan affordability.' },
  { id: 'EDUCATION', title: 'Education fund', description: 'Save for education expenses over time.' },
  { id: 'EMERGENCY_FUND', title: 'Emergency fund', description: 'Keep 3–6 months expenses liquid and safe.' },
]

export default function GoalsStepPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>(['WEALTH_GROWTH'])

  useEffect(() => {
    const draft = loadFinancialProfileDraft()
    if (draft.goals && draft.goals.length > 0) setGoals(draft.goals as Goal[])
  }, [])

  const selected = useMemo(() => new Set(goals), [goals])

  const toggle = (goal: Goal) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const handleBack = () => router.push('/onboarding/savings-debt')

  const handleNext = () => {
    const draft = loadFinancialProfileDraft()
    saveFinancialProfileDraft({ ...draft, goals })
    router.push('/onboarding/risk')
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Investment goals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick the goals that matter. FinSathi will prioritize them in your plan.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                selected.has(opt.id)
                  ? 'border-fintech-secondary bg-fintech-secondary/5'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    selected.has(opt.id) ? 'bg-fintech-secondary border-fintech-secondary' : 'border-gray-300'
                  }`}
                >
                  {selected.has(opt.id) && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button className="btn btn-outline" onClick={handleBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} disabled={goals.length === 0}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

