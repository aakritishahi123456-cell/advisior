import { ArrowUpRight, Activity, TrendingUp, Shield } from 'lucide-react'
import FintechCard from '@/components/fintech/ui/FintechCard'
import FintechStat from '@/components/fintech/ui/FintechStat'
import IndexLineChart from '@/components/fintech/charts/IndexLineChart'
import PortfolioDonut from '@/components/fintech/charts/PortfolioDonut'
import StockMovesTable from '@/components/fintech/widgets/StockMovesTable'
import InsightFeed from '@/components/fintech/widgets/InsightFeed'

const indexSeries = [
  { date: 'Mon', value: 1987 },
  { date: 'Tue', value: 2014 },
  { date: 'Wed', value: 2002 },
  { date: 'Thu', value: 2038 },
  { date: 'Fri', value: 2061 },
]

const allocation = [
  { name: 'Banks', value: 38, color: '#635BFF' },
  { name: 'Hydro', value: 22, color: '#00D4AA' },
  { name: 'Insurance', value: 18, color: '#8B85FF' },
  { name: 'Hotels', value: 10, color: '#38bdf8' },
  { name: 'Cash', value: 12, color: '#94A3B8' },
]

const gainers = [
  { symbol: 'NABIL', name: 'Nabil Bank', price: 490, changePct: 2.4, sector: 'Commercial Banks' },
  { symbol: 'HBL', name: 'Himalayan Bank', price: 520, changePct: 3.2, sector: 'Commercial Banks' },
  { symbol: 'NLIC', name: 'Nepal Life', price: 770, changePct: 1.9, sector: 'Insurance' },
  { symbol: 'HDL', name: 'Himalayan Distillery', price: 1650, changePct: 1.2, sector: 'Manufacturing' },
]

const losers = [
  { symbol: 'NRIC', name: 'Nepal Reinsurance', price: 690, changePct: -1.7, sector: 'Insurance' },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', price: 205, changePct: -1.1, sector: 'Hydropower' },
  { symbol: 'CHDC', name: 'CEDB Hydropower', price: 880, changePct: -0.8, sector: 'Hydropower' },
  { symbol: 'NTC', name: 'Nepal Telecom', price: 895, changePct: -0.6, sector: 'Others' },
]

const insights = [
  {
    tag: 'Trend' as const,
    title: 'Banking sector leading the market',
    text: 'Strong breadth and consistent gains suggest a near-term uptrend in tier-1 banks.',
    time: 'Today',
  },
  {
    tag: 'Opportunity' as const,
    title: 'Momentum building in hydropower',
    text: 'Rising volumes in mid-caps may indicate rotation into hydro after consolidation.',
    time: 'Today',
  },
  {
    tag: 'Risk' as const,
    title: 'Watch abnormal moves',
    text: 'A few symbols show elevated volatility. Reduce single-stock concentration.',
    time: 'Today',
  },
]

export default function FintechDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">
            A modern fintech view of NEPSE, portfolio allocation, and AI-generated market insights.
          </p>
        </div>
        <a
          href="/fintech/market"
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Market Overview <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <FintechStat
          label="NEPSE Index"
          value="2,061.00"
          subValue="Market direction: UP"
          delta={1.13}
          tone="up"
        />
        <FintechStat label="Advancers / Decliners" value="141 / 83" subValue="Breadth is improving" />
        <FintechStat label="Volatility Watch" value="Low → Moderate" subValue="Abnormal moves: 3 symbols" />
        <FintechStat
          label="Portfolio Risk Score"
          value="42 / 100"
          subValue="Diversification OK"
          delta={-0.8}
          tone="down"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FintechCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-fintech-accent" />
                <div className="text-sm font-semibold text-white">NEPSE Trend</div>
              </div>
              <div className="mt-1 text-xs text-slate-400">5-day index movement</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              UPTREND
            </div>
          </div>
          <IndexLineChart data={indexSeries} />
        </FintechCard>

        <FintechCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-fintech-secondary-light" />
                <div className="text-sm font-semibold text-white">Allocation</div>
              </div>
              <div className="mt-1 text-xs text-slate-400">Risk-weighted diversification</div>
            </div>
          </div>
          <PortfolioDonut data={allocation} />
        </FintechCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StockMovesTable title="Top Gainers" rows={gainers} />
        <StockMovesTable title="Top Losers" rows={losers} />
        <InsightFeed items={insights} />
      </div>

      <FintechCard className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-fintech-accent" />
              <div className="text-sm font-semibold text-white">Next actions</div>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Build a portfolio or deep-dive a symbol using the next pages.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/fintech/stocks"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Stock Analysis
            </a>
            <a
              href="/fintech/portfolio"
              className="rounded-2xl bg-fintech-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-fintech-secondary-light"
            >
              Portfolio Builder
            </a>
            <a
              href="/fintech/insights"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              AI Insights
            </a>
          </div>
        </div>
      </FintechCard>
    </div>
  )
}

