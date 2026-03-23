'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowDownRight, ArrowUpRight, PieChart, RefreshCw, SlidersHorizontal, Wallet } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import Skeleton from '@/components/ui/Skeleton'

type PortfolioItem = {
  symbol: string
  quantity: number
  buyPrice: number
  currentPrice: number
  currentValue: number
  profitLoss: number
  dailyChange: number
  dailyChangePercent: number
}

type PortfolioResponse = {
  totalValue: number
  totalInvestment: number
  totalProfitLoss: number
  dailyChange: number
  dailyChangePercent: number
  items: PortfolioItem[]
}

const REFRESH_INTERVAL_MS = 45_000

function resolveApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')
  return configured || 'http://localhost:3001'
}

function formatCurrency(value: number): string {
  return `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatSignedCurrency(value: number): string {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${formatCurrency(Math.abs(value))}`
}

function formatSignedPercent(value: number): string {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${Math.abs(value).toFixed(2)}%`
}

function isPositive(value: number): boolean {
  return value >= 0
}

async function fetchPortfolio(userId: string): Promise<PortfolioResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const response = await fetch(`${resolveApiBaseUrl()}/api/portfolio/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load portfolio.')
  }

  if (!payload?.data) {
    throw new Error('Portfolio response was empty.')
  }

  return payload.data as PortfolioResponse
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-[420px] rounded-2xl" />
    </div>
  )
}

export default function PortfolioPage() {
  const { user, isAuthenticated } = useAuth()
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId || !isAuthenticated) {
      setPortfolio(null)
      setIsLoading(false)
      setError('Sign in to view your live portfolio.')
      return
    }

    let active = true

    const loadPortfolio = async (refresh = false) => {
      if (!active) {
        return
      }

      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const data = await fetchPortfolio(userId)
        if (!active) {
          return
        }

        setPortfolio(data)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load portfolio.')
      } finally {
        if (!active) {
          return
        }

        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    void loadPortfolio(false)
    const intervalId = window.setInterval(() => {
      void loadPortfolio(true)
    }, REFRESH_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [isAuthenticated, userId])

  if (isLoading) {
    return <PortfolioSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <PieChart className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portfolio</h1>
            <p className="mt-1 text-sm text-slate-600">
              Live holdings synced from your backend portfolio engine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (userId) {
                setIsRefreshing(true)
                fetchPortfolio(userId)
                  .then((data) => {
                    setPortfolio(data)
                    setError(null)
                  })
                  .catch((refreshError) => {
                    setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh portfolio.')
                  })
                  .finally(() => {
                    setIsRefreshing(false)
                  })
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/portfolio-optimizer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Optimize
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Unable to load portfolio</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Wallet className="h-4 w-4" />
            Total Value
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formatCurrency(portfolio?.totalValue ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Investment</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formatCurrency(portfolio?.totalInvestment ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Profit / Loss</p>
          <div
            className={`mt-3 flex items-center gap-2 text-3xl font-bold tracking-tight ${
              isPositive(portfolio?.totalProfitLoss ?? 0) ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive(portfolio?.totalProfitLoss ?? 0) ? (
              <ArrowUpRight className="h-7 w-7" />
            ) : (
              <ArrowDownRight className="h-7 w-7" />
            )}
            <span>{formatSignedCurrency(portfolio?.totalProfitLoss ?? 0)}</span>
          </div>
          <p
            className={`mt-2 text-sm font-medium ${
              isPositive(portfolio?.dailyChange ?? 0) ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            Today {formatSignedCurrency(portfolio?.dailyChange ?? 0)} ({formatSignedPercent(portfolio?.dailyChangePercent ?? 0)})
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Holdings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Auto-refreshing every {Math.round(REFRESH_INTERVAL_MS / 1000)} seconds.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {portfolio?.items.length ?? 0} positions
          </div>
        </div>

        {portfolio && portfolio.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Symbol</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Buy Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Current Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total Value</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Profit / Loss</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Daily</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolio.items.map((item) => {
                  const profitClass = isPositive(item.profitLoss) ? 'text-emerald-600' : 'text-rose-600'
                  const dailyClass = isPositive(item.dailyChange) ? 'text-emerald-600' : 'text-rose-600'

                  return (
                    <tr key={item.symbol} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.symbol}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">{item.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(item.buyPrice)}</td>
                      <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(item.currentPrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(item.currentValue)}
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${profitClass}`}>
                        {formatSignedCurrency(item.profitLoss)}
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${dailyClass}`}>
                        <div>{formatSignedCurrency(item.dailyChange)}</div>
                        <div className="text-xs font-medium">{formatSignedPercent(item.dailyChangePercent)}</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">No holdings found</p>
            <p className="mt-2 text-sm text-slate-500">
              Add portfolio items in the backend to see live holdings here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
