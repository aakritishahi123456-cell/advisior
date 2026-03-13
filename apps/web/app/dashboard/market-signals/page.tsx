'use client'

import Link from 'next/link'
import { Filter, Sparkles } from 'lucide-react'
import PageHeader from '@/components/platform/PageHeader'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

type Signal = {
  id: string
  symbol: string
  action: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  horizon: '1W' | '1M' | '3M'
  reason: string
  updatedAt: string
}

const signals: Signal[] = [
  {
    id: '1',
    symbol: 'NABIL',
    action: 'BUY',
    confidence: 85,
    horizon: '1M',
    reason: 'Strong capital ratios and improving NIM; valuation below sector median.',
    updatedAt: 'Today, 11:20',
  },
  {
    id: '2',
    symbol: 'HBL',
    action: 'HOLD',
    confidence: 70,
    horizon: '1W',
    reason: 'Fair valuation; wait for a pullback before adding exposure.',
    updatedAt: 'Today, 10:05',
  },
  {
    id: '3',
    symbol: 'NICBL',
    action: 'BUY',
    confidence: 78,
    horizon: '3M',
    reason: 'High dividend yield with stable earnings; risk is moderate.',
    updatedAt: 'Yesterday, 15:40',
  },
  {
    id: '4',
    symbol: 'SHL',
    action: 'SELL',
    confidence: 66,
    horizon: '1M',
    reason: 'Weak margin outlook; momentum deteriorating vs sector.',
    updatedAt: 'Yesterday, 12:10',
  },
]

function actionBadge(action: Signal['action']) {
  if (action === 'BUY') return <Badge variant="success">BUY</Badge>
  if (action === 'SELL') return <Badge variant="danger">SELL</Badge>
  return <Badge variant="warning">HOLD</Badge>
}

export default function MarketSignalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Signals"
        description="AI-generated BUY/HOLD/SELL signals with structured reasoning."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Market Signals' }]}
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <Link
              href="/dashboard/ai-advisor"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-fintech-secondary to-fintech-accent hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Link>
          </>
        }
      />

      <Table
        title="Signals"
        description="Signals are directional, not guarantees. Use risk controls and diversification."
        rows={signals}
        columns={[
          {
            key: 'symbol',
            header: 'Symbol',
            render: (row) => (
              <Link href={`/dashboard/investment-research/${row.symbol}`} className="font-bold text-gray-900 hover:underline">
                {row.symbol}
              </Link>
            ),
          },
          { key: 'action', header: 'Signal', render: (row) => actionBadge(row.action) },
          {
            key: 'confidence',
            header: 'Confidence',
            render: (row) => (
              <div className="min-w-[140px]">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{row.confidence}%</span>
                  <span className="text-gray-400">{row.horizon}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-fintech-secondary to-fintech-accent"
                    style={{ width: `${row.confidence}%` }}
                  />
                </div>
              </div>
            ),
          },
          { key: 'reason', header: 'Reasoning', render: (row) => <span className="text-gray-700">{row.reason}</span>, className: 'min-w-[360px]' },
          { key: 'updatedAt', header: 'Updated', render: (row) => <span className="text-gray-500">{row.updatedAt}</span> },
        ]}
      />
    </div>
  )
}

