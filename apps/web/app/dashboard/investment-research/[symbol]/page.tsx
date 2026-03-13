'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Building2, Sparkles } from 'lucide-react'
import PageHeader from '@/components/platform/PageHeader'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

const CompanyRevenueTrendChart = dynamic(
  () => import('@/components/charts/CompanyRevenueTrendChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const CompanyProfitMarginChart = dynamic(
  () => import('@/components/charts/CompanyProfitMarginChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const CompanyBalanceSheetChart = dynamic(
  () => import('@/components/charts/CompanyBalanceSheetChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

const mock = {
  NABIL: {
    name: 'Nabil Bank Limited',
    sector: 'Banking',
    price: 490,
    changePct: 2.4,
    marketCap: '45.2B',
    pe: 8.5,
    pb: 1.3,
    dividend: 12.3,
  },
  HBL: {
    name: 'HBL Bank Limited',
    sector: 'Banking',
    price: 520,
    changePct: 3.2,
    marketCap: '52.0B',
    pe: 9.1,
    pb: 1.4,
    dividend: 11.1,
  },
  NICBL: {
    name: 'NIC Asia Bank Ltd',
    sector: 'Banking',
    price: 380,
    changePct: 1.8,
    marketCap: '32.1B',
    pe: 7.2,
    pb: 1.1,
    dividend: 10.5,
  },
} as const

function formatNpr(n: number) {
  return `NPR ${n.toLocaleString()}`
}

export default function CompanyAnalysisPage() {
  const params = useParams<{ symbol: string }>()
  const symbol = (params?.symbol || '').toUpperCase()
  const data = (mock as any)[symbol] || {
    name: `${symbol} Company`,
    sector: '—',
    price: 0,
    changePct: 0,
    marketCap: '—',
    pe: 0,
    pb: 0,
    dividend: 0,
  }

  const [range, setRange] = useState<'1Y' | '3Y' | '5Y'>('3Y')

  const revenue = useMemo(
    () => [
      { year: '2022', value: 12.4 },
      { year: '2023', value: 13.8 },
      { year: '2024', value: 15.1 },
      { year: '2025', value: 16.6 },
      { year: '2026', value: 18.0 },
    ].slice(range === '1Y' ? 2 : range === '3Y' ? 1 : 0),
    [range]
  )

  const margins = useMemo(
    () => [
      { quarter: 'Q1', margin: 18.2 },
      { quarter: 'Q2', margin: 19.1 },
      { quarter: 'Q3', margin: 17.6 },
      { quarter: 'Q4', margin: 20.3 },
    ],
    []
  )

  const balance = useMemo(
    () => [
      { year: '2022', assets: 100, liabilities: 78 },
      { year: '2023', assets: 112, liabilities: 86 },
      { year: '2024', assets: 124, liabilities: 94 },
      { year: '2025', assets: 138, liabilities: 104 },
      { year: '2026', assets: 152, liabilities: 116 },
    ].slice(range === '1Y' ? 2 : range === '3Y' ? 1 : 0),
    [range]
  )

  const ratios = [
    { label: 'P/E', value: data.pe },
    { label: 'P/B', value: data.pb },
    { label: 'Dividend yield', value: `${data.dividend}%` },
    { label: 'Market cap', value: data.marketCap },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${symbol} — Company Analysis`}
        description={`${data.name} • ${data.sector}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investment Research', href: '/dashboard/investment-research' },
          { label: symbol },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/investment-research"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link
              href="/dashboard/ai-advisor"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-fintech-secondary to-fintech-accent hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Link>
          </div>
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-fintech-secondary/10">
                  <Building2 className="w-5 h-5 text-fintech-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{data.name}</p>
                  <p className="text-xs text-gray-500">{data.sector}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatNpr(data.price)}</p>
                <p className={`text-sm font-semibold ${data.changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.changePct >= 0 ? '+' : ''}
                  {data.changePct}%
                </p>
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-4 gap-3">
              {ratios.map((r) => (
                <div key={r.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">{r.label}</p>
                  <p className="font-bold text-gray-900 mt-1">{r.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Revenue trend</p>
              <div className="flex items-center gap-2">
                {(['1Y', '3Y', '5Y'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      range === r ? 'bg-fintech-primary text-white border-fintech-primary' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 mt-4">
              <CompanyRevenueTrendChart data={revenue} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Values shown are normalized for demo purposes.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-900">Profit margin (quarterly)</p>
              <div className="h-56 mt-4">
                <CompanyProfitMarginChart data={margins} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-900">Balance sheet trend</p>
              <div className="h-56 mt-4">
                <CompanyBalanceSheetChart data={balance} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">AI analysis summary</p>
              <Badge variant="premium">AI</Badge>
            </div>
            <p className="text-sm text-gray-700 mt-4">
              Based on recent trends, {symbol} shows improving revenue momentum and resilient margins. Debt levels remain
              manageable relative to sector peers. Consider position sizing to reduce concentration risk and monitor
              regulatory updates.
            </p>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Suggested action</p>
              <p className="font-bold text-gray-900 mt-1">Accumulate on dips</p>
              <p className="text-xs text-gray-500 mt-1">Horizon: 1–3 months • Confidence: 78%</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-fintech-primary to-fintech-secondary text-white rounded-2xl p-6">
            <p className="font-semibold">Pro tip</p>
            <p className="text-sm text-white/80 mt-2">
              Combine fundamentals (ratios, growth) with sentiment (volume, momentum) before acting on any signal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
