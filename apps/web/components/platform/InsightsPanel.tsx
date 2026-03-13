'use client'

import Link from 'next/link'
import { Sparkles, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

type Insight = {
  type: 'opportunity' | 'warning' | 'info'
  title: string
  description: string
  href?: string
  time: string
}

const defaultInsights: Insight[] = [
  {
    type: 'opportunity',
    title: 'Banking sector momentum',
    description: 'Tier‑1 banks are leading volume; consider a diversified basket.',
    href: '/dashboard/investment-research',
    time: '2h ago',
  },
  {
    type: 'warning',
    title: 'Interest rates elevated',
    description: 'If you plan a home loan, compare fixed vs floating options.',
    href: '/dashboard/loan-simulator',
    time: '5h ago',
  },
  {
    type: 'info',
    title: 'Dividend season watch',
    description: 'Track payout announcements and ex‑dividend dates this week.',
    href: '/dashboard/market-intelligence',
    time: '1d ago',
  },
]

function insightIcon(type: Insight['type']) {
  if (type === 'opportunity') return <TrendingUp className="w-4 h-4 text-gains" />
  if (type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-600" />
  return <Sparkles className="w-4 h-4 text-fintech-secondary" />
}

function insightBadge(type: Insight['type']) {
  if (type === 'opportunity') return <Badge variant="success">Opportunity</Badge>
  if (type === 'warning') return <Badge variant="warning">Watch</Badge>
  return <Badge variant="premium">AI</Badge>
}

export default function InsightsPanel({
  title = 'Insights',
  insights = defaultInsights,
}: {
  title?: string
  insights?: Insight[]
}) {
  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-20 space-y-4">
        <Card padding="md" className="bg-white border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-fintech-secondary" />
              <p className="text-sm font-semibold text-gray-900">{title}</p>
            </div>
            <Link href="/dashboard/ai-advisor" className="text-xs font-semibold text-fintech-secondary hover:underline">
              Ask AI
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {insights.map((insight) => (
              <div
                key={`${insight.title}-${insight.time}`}
                className="rounded-xl border border-gray-100 p-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{insightIcon(insight.type)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insightBadge(insight.type)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{insight.time}</p>
                  {insight.href && (
                    <Link href={insight.href} className="text-[11px] text-gray-700 hover:text-gray-900 font-semibold inline-flex items-center gap-1">
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md" className="bg-gradient-to-br from-fintech-primary to-fintech-secondary text-white border-0">
          <p className="text-sm font-semibold">Upgrade to Investor</p>
          <p className="text-xs text-white/80 mt-1">
            Unlock advanced analysis, market signals, and portfolio optimization.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center justify-center w-full rounded-xl bg-white text-fintech-primary font-semibold text-sm py-2 hover:bg-white/90"
          >
            See plans
          </Link>
        </Card>
      </div>
    </aside>
  )
}

