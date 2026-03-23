'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, BadgePercent, Calculator, CreditCard, Landmark, RefreshCw } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import { api, endpoints } from '@/lib/apiClient'
import { useAuth } from '@/stores/authStore'

type RankingMode = 'lowest_total_cost' | 'lowest_emi'

type LoanRecommendation = {
  bankName: string
  interestRate: number
  tenure: number
  processingFee: number
  emi: number
  totalInterest: number
  totalCost: number
  rankingScore: number
  sourceUrl: string | null
  lastUpdated: string
}

type LoanSimulationResponse = {
  loanAmount: number
  tenure: number
  ranking: RankingMode
  bestLoanSuggestions: LoanRecommendation[]
  summary: {
    bestByTotalCost: LoanRecommendation | null
    bestByEMI: LoanRecommendation | null
  }
  savedSimulationId: string | null
}

const DEFAULT_FORM = {
  loanAmount: 5_000_000,
  tenureYears: 20,
  loanType: 'HOME',
  ranking: 'lowest_total_cost' as RankingMode,
}

function formatCurrency(value: number): string {
  return `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function LoanMarketplaceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Skeleton className="h-[420px] rounded-[28px]" />
        <Skeleton className="h-[420px] rounded-[28px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  )
}

export default function LoanSimulatorPage() {
  const { isAuthenticated } = useAuth()
  const [loanAmount, setLoanAmount] = useState(DEFAULT_FORM.loanAmount)
  const [tenureYears, setTenureYears] = useState(DEFAULT_FORM.tenureYears)
  const [loanType, setLoanType] = useState(DEFAULT_FORM.loanType)
  const [ranking, setRanking] = useState<RankingMode>(DEFAULT_FORM.ranking)
  const [results, setResults] = useState<LoanSimulationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loanTypes = [
    { id: 'HOME', name: 'Home Loan' },
    { id: 'PERSONAL', name: 'Personal Loan' },
    { id: 'BUSINESS', name: 'Business Loan' },
    { id: 'AUTO', name: 'Vehicle Loan' },
    { id: 'EDUCATION', name: 'Education Loan' },
  ]

  async function loadRecommendations(submit = false) {
    const tenure = tenureYears * 12

    if (loanAmount <= 0 || tenure <= 0) {
      setError('Enter a valid loan amount and tenure.')
      return
    }

    if (submit) {
      setIsSubmitting(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await api.post<LoanSimulationResponse>(endpoints.loans.simulate, {
        loanAmount,
        tenure,
        loanType,
        ranking,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to simulate loan options.')
      }

      setResults(response.data)
      setError(null)
    } catch (requestError: any) {
      setError(requestError?.error || requestError?.message || 'Failed to load loan recommendations.')
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    void loadRecommendations(false)
    // Intentionally only load once on mount; subsequent changes are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading && !results) {
    return <LoanMarketplaceSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
            <Calculator className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Loan Marketplace</h1>
            <p className="mt-1 text-sm text-slate-600">
              Compare Nepal loan products by EMI and total cost using real backend recommendations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadRecommendations(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          Refresh quotes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your loan need</h2>
          <p className="mt-1 text-sm text-slate-500">Adjust the amount and tenure, then compare lender offers.</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loan Type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {loanTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setLoanType(type.id)}
                    className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      loanType === type.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Loan Amount</label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={loanAmount}
                onChange={(event) => setLoanAmount(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Tenure (Years)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={tenureYears}
                onChange={(event) => setTenureYears(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Rank by</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRanking('lowest_total_cost')}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    ranking === 'lowest_total_cost'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Lowest total cost
                </button>
                <button
                  type="button"
                  onClick={() => setRanking('lowest_emi')}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    ranking === 'lowest_emi'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                  }`}
                >
                  Lowest EMI
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadRecommendations(true)}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Calculating offers...' : 'Compare loans'}
            </button>

            <p className="text-xs text-slate-500">
              Tenure is sent as {tenureYears * 12} months to match the backend calculation engine.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Unable to compare loans</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Landmark className="h-4 w-4" />
                Best by total cost
              </div>
              <p className="mt-3 text-xl font-bold text-slate-900">
                {results?.summary.bestByTotalCost?.bankName ?? 'No result'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                EMI {formatCurrency(results?.summary.bestByTotalCost?.emi ?? 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Total cost {formatCurrency(results?.summary.bestByTotalCost?.totalCost ?? 0)}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <CreditCard className="h-4 w-4" />
                Best by lowest EMI
              </div>
              <p className="mt-3 text-xl font-bold text-slate-900">
                {results?.summary.bestByEMI?.bankName ?? 'No result'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                EMI {formatCurrency(results?.summary.bestByEMI?.emi ?? 0)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Total interest {formatCurrency(results?.summary.bestByEMI?.totalInterest ?? 0)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recommended lenders</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ranked by {results?.ranking === 'lowest_emi' ? 'lowest EMI first' : 'lowest total cost first'}.
                </p>
              </div>
              {results?.savedSimulationId ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Saved simulation
                </div>
              ) : (
                <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  {isAuthenticated ? 'Save unavailable' : 'Sign in to save simulations'}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {(results?.bestLoanSuggestions ?? []).map((item, index) => (
                <div key={`${item.bankName}-${item.interestRate}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.bankName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Updated {new Date(item.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <BadgePercent className="h-4 w-4" />
                        Rate
                      </div>
                      <p className="mt-2 text-lg font-bold text-slate-900">{formatPercent(item.interestRate)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-slate-500">Processing fee</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(item.processingFee)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-slate-500">Monthly EMI</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(item.emi)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-slate-500">Total interest</p>
                      <p className="mt-2 text-lg font-bold text-rose-600">{formatCurrency(item.totalInterest)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Total cost</p>
                    <p className="mt-2 text-2xl font-bold">{formatCurrency(item.totalCost)}</p>
                  </div>

                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                      View source
                    </a>
                  ) : null}
                </div>
              ))}
            </div>

            {results?.bestLoanSuggestions.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">No lender recommendations found for this request.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
