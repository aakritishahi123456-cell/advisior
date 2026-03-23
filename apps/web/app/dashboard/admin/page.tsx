'use client'

import { useEffect, useState } from 'react'
import { Activity, BarChart3, CreditCard, RefreshCw, TrendingDown, TrendingUp, UserPlus } from 'lucide-react'
import { api, endpoints } from '@/lib/apiClient'

type AnalyticsDashboard = {
  summary: {
    signups: number
    reportsGenerated: number
    upgradeClicks: number
    paymentSuccesses: number
    conversionRate: number
    churnRate: number
  }
  usagePatterns: {
    byEvent: Array<{ eventName: string; count: number }>
    byDay: Array<{ date: string; count: number }>
    recentEvents: Array<{
      id: string
      eventName: string
      category: string
      createdAt: string
      userId: string | null
    }>
  }
}

function StatCard(props: {
  title: string
  value: string | number
  hint: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{props.title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{props.value}</p>
          <p className="mt-2 text-sm text-slate-500">{props.hint}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{props.icon}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const response = await api.get<AnalyticsDashboard>(endpoints.analytics.dashboard)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load analytics dashboard')
      }

      setData(response.data)
    } catch (apiError: any) {
      setError(apiError?.error || 'Failed to load analytics dashboard')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDashboard(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Conversion, churn, and product usage from live event data.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {isLoading && !data ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading analytics dashboard...
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Signups"
              value={data.summary.signups}
              hint="Tracked from successful registrations"
              icon={<UserPlus className="h-6 w-6" />}
            />
            <StatCard
              title="Reports Generated"
              value={data.summary.reportsGenerated}
              hint="Successful AI report outputs"
              icon={<BarChart3 className="h-6 w-6" />}
            />
            <StatCard
              title="Upgrade Clicks"
              value={data.summary.upgradeClicks}
              hint="Subscription upgrade intent"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <StatCard
              title="Payment Success"
              value={data.summary.paymentSuccesses}
              hint="Verified completed payments"
              icon={<CreditCard className="h-6 w-6" />}
            />
            <StatCard
              title="Conversion Rate"
              value={`${data.summary.conversionRate}%`}
              hint="Payment success / upgrade clicks"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <StatCard
              title="Churn Rate"
              value={`${data.summary.churnRate}%`}
              hint="Expired or cancelled paid plans"
              icon={<TrendingDown className="h-6 w-6" />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Usage Patterns</h2>
              <div className="mt-4 space-y-3">
                {data.usagePatterns.byEvent.map((event) => (
                  <div key={event.eventName} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium text-slate-600">{event.eventName}</div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${(event.count / Math.max(...data.usagePatterns.byEvent.map((item) => item.count), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-semibold text-slate-900">{event.count}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Daily Activity</h2>
              <div className="mt-4 space-y-3">
                {data.usagePatterns.byDay.map((day) => (
                  <div key={day.date} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">{day.date}</span>
                    <span className="text-sm font-semibold text-slate-900">{day.count} events</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Recent Funnel Events</h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usagePatterns.recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{event.eventName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{event.category}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{event.userId ?? 'anonymous'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
