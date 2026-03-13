'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { loadFinancialProfileDraft } from '@/lib/onboardingDraft'

export default function SettingsFinancialProfilePage() {
  const [draft, setDraft] = useState<any>(null)

  useEffect(() => {
    setDraft(loadFinancialProfileDraft())
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Financial profile</h2>
            <p className="text-sm text-gray-500 mt-1">
              Used for financial health scoring, loan suggestions, and portfolio recommendations.
            </p>
          </div>
          <Link href="/onboarding" className="btn btn-primary">
            Update profile
          </Link>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Income</p>
            <p className="font-bold text-gray-900 mt-1">
              {draft?.incomeMonthly ? `NPR ${Number(draft.incomeMonthly).toLocaleString()}/mo` : 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Source: {draft?.incomeSource || '—'}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Savings & debt</p>
            <p className="font-bold text-gray-900 mt-1">
              Savings: {draft?.savingsTotal ? `NPR ${Number(draft.savingsTotal).toLocaleString()}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Debt: {draft?.debtTotal ? `NPR ${Number(draft.debtTotal).toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50 sm:col-span-2">
            <p className="text-xs text-gray-500">Goals & risk</p>
            <p className="font-bold text-gray-900 mt-1">{draft?.goals?.length ? draft.goals.join(', ') : '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Risk tolerance: {draft?.riskTolerance || '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900">Tip</h3>
        <p className="text-sm text-gray-600 mt-2">
          The better your profile, the more structured the AI advisor outputs become (plans, allocations, loan thresholds).
        </p>
      </div>
    </div>
  )
}

