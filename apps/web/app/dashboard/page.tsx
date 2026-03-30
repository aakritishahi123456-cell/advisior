'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  Bot,
  CreditCard,
  Landmark,
  PieChart,
  PiggyBank,
  Percent,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import {
  createFallbackDashboardSnapshot,
  fetchDashboardSnapshot,
  type DashboardAllocationSlice,
  type DashboardInsight,
  type DashboardMetricCard,
  type DashboardMetricIconKey,
  type DashboardSnapshot,
  type DashboardStock,
} from '@/lib/dashboard'

const DashboardPerformanceChart = dynamic(
  () => import('@/components/charts/DashboardPerformanceChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const DashboardAllocationChart = dynamic(
  () => import('@/components/charts/DashboardAllocationChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

function metricIcon(iconKey: DashboardMetricIconKey) {
  switch (iconKey) {
    case 'monthly-returns':
      return <TrendingUp className="w-5 h-5" />
    case 'investments':
      return <PiggyBank className="w-5 h-5" />
    case 'ytd':
      return <Percent className="w-5 h-5" />
    case 'wallet':
    default:
      return <Wallet className="w-5 h-5" />
  }
}

function insightIcon(type: DashboardInsight['type']) {
  switch (type) {
    case 'opportunity':
      return <TrendingUp className="w-4 h-4 text-green-600" />
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-600" />
    default:
      return <Bot className="w-4 h-4 text-blue-600" />
  }
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function formatMetricChange(change: number) {
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

function formatStockChange(change: number) {
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(() => createFallbackDashboardSnapshot())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let active = true

    const loadDashboard = async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const snapshot = await fetchDashboardSnapshot()
        if (!active) {
          return
        }

        setDashboard(snapshot)
      } finally {
        if (!active) {
          return
        }

        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    void loadDashboard(false)

    return () => {
      active = false
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const snapshot = await fetchDashboardSnapshot()
      setDashboard(snapshot)
    } finally {
      setIsRefreshing(false)
    }
  }

  const metrics: DashboardMetricCard[] = dashboard.metrics.length > 0 ? dashboard.metrics : createFallbackDashboardSnapshot().metrics
  const performanceData = dashboard.performanceData
  const portfolioData: DashboardAllocationSlice[] = dashboard.portfolioData
  const topStocks: DashboardStock[] = dashboard.topStocks
  const aiInsights: DashboardInsight[] = dashboard.aiInsights
  const usingFallbackData = dashboard.source === 'fallback'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, John! Here's your financial overview.</p>
          {usingFallbackData && !isLoading ? (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Live data is unavailable right now. Showing a deterministic fallback snapshot.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            void handleRefresh()
          }}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={`${metric.title}-${index}`} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className="rounded-xl bg-[#635BFF]/10 p-2">
                <div className="text-[#635BFF]">{metricIcon(metric.iconKey)}</div>
              </div>
            </div>
            <div className={`flex items-center ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {metric.trend === 'up' ? (
                <ArrowUpRight className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm font-semibold">{formatMetricChange(metric.change)}</span>
              <span className="ml-2 text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Portfolio Performance */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
            <div className="flex gap-2">
              {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    period === '6M' ? 'bg-[#0A2540] text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {performanceData.length > 0 ? (
              <DashboardPerformanceChart data={performanceData} />
            ) : (
              <EmptyState
                title="No performance data"
                description="The dashboard snapshot did not include chart points yet."
              />
            )}
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Asset Allocation</h3>
          <div className="h-48">
            {portfolioData.length > 0 ? (
              <DashboardAllocationChart data={portfolioData} />
            ) : (
              <EmptyState title="No allocation data" description="Asset allocation is currently unavailable." />
            )}
          </div>
          <div className="mt-4 space-y-2">
            {portfolioData.length > 0 ? (
              portfolioData.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No allocation breakdown available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Stocks */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top NEPSE Stocks</h3>
            <a href="/dashboard/investment-research" className="text-sm font-medium text-[#635BFF] hover:underline">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {topStocks.length > 0 ? (
              topStocks.map((stock, index) => (
                <div key={`${stock.symbol}-${index}`} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Landmark className="h-5 w-5 text-[#635BFF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{stock.symbol}</p>
                      <p className="text-xs text-gray-500">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">NPR {stock.price}</p>
                    <p className={`text-sm font-medium ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatStockChange(stock.change)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No stock data" description="There are no stock highlights to show right now." />
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#635BFF] to-[#8B85FF] px-2 py-0.5 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <a href="/dashboard/ai-advisor" className="text-sm font-medium text-[#635BFF] hover:underline">
              Ask AI
            </a>
          </div>
          <div className="space-y-3">
            {aiInsights.length > 0 ? (
              aiInsights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className={`rounded-xl border p-4 ${
                    insight.type === 'opportunity'
                      ? 'border-green-200 bg-green-50'
                      : insight.type === 'warning'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg p-1.5 ${
                        insight.type === 'opportunity'
                          ? 'bg-green-100'
                          : insight.type === 'warning'
                          ? 'bg-amber-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {insightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{insight.description}</p>
                      <p className="mt-2 text-xs text-gray-400">{insight.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No insights yet" description="AI insights will appear here once data is available." />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <a
          href="/dashboard/loan-simulator"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#635BFF] hover:shadow-md"
        >
          <div className="rounded-lg bg-[#635BFF]/10 p-2">
            <CreditCard className="h-5 w-5 text-[#635BFF]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Loan Calculator</p>
            <p className="text-xs text-gray-500">Calculate EMI</p>
          </div>
        </a>
        <a
          href="/dashboard/ai-advisor"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#635BFF] hover:shadow-md"
        >
          <div className="rounded-lg bg-[#00D4AA]/10 p-2">
            <Bot className="h-5 w-5 text-[#00D4AA]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Ask AI Advisor</p>
            <p className="text-xs text-gray-500">Get insights</p>
          </div>
        </a>
        <a
          href="/dashboard/portfolio"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#635BFF] hover:shadow-md"
        >
          <div className="rounded-lg bg-[#0A2540]/10 p-2">
            <PieChart className="h-5 w-5 text-[#0A2540]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">View Portfolio</p>
            <p className="text-xs text-gray-500">Track holdings</p>
          </div>
        </a>
        <a
          href="/dashboard/financial-planning"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#635BFF] hover:shadow-md"
        >
          <div className="rounded-lg bg-purple-100 p-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Plan Goals</p>
            <p className="text-xs text-gray-500">Financial planning</p>
          </div>
        </a>
      </div>
    </div>
  )
}
