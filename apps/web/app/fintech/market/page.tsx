import FintechCard from '@/components/fintech/ui/FintechCard'
import IndexLineChart from '@/components/fintech/charts/IndexLineChart'
import GainersLosersBar from '@/components/fintech/charts/GainersLosersBar'
import StockMovesTable from '@/components/fintech/widgets/StockMovesTable'

const indexSeries = [
  { date: 'Mon', value: 1987 },
  { date: 'Tue', value: 2014 },
  { date: 'Wed', value: 2002 },
  { date: 'Thu', value: 2038 },
  { date: 'Fri', value: 2061 },
]

const movers = [
  { symbol: 'HBL', change: 3.2 },
  { symbol: 'NABIL', change: 2.4 },
  { symbol: 'NLIC', change: 1.9 },
  { symbol: 'NRIC', change: -1.7 },
  { symbol: 'UPPER', change: -1.1 },
  { symbol: 'NTC', change: -0.6 },
]

const gainers = [
  { symbol: 'HBL', name: 'Himalayan Bank', price: 520, changePct: 3.2, sector: 'Commercial Banks' },
  { symbol: 'NABIL', name: 'Nabil Bank', price: 490, changePct: 2.4, sector: 'Commercial Banks' },
  { symbol: 'NLIC', name: 'Nepal Life', price: 770, changePct: 1.9, sector: 'Insurance' },
]

const losers = [
  { symbol: 'NRIC', name: 'Nepal Reinsurance', price: 690, changePct: -1.7, sector: 'Insurance' },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', price: 205, changePct: -1.1, sector: 'Hydropower' },
  { symbol: 'NTC', name: 'Nepal Telecom', price: 895, changePct: -0.6, sector: 'Others' },
]

export default function MarketOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Market Overview</h1>
        <p className="text-sm text-slate-400">
          Index movement, breadth, and daily movers. Plug this into your NEPSE data agents for live updates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FintechCard className="p-5 lg:col-span-2">
          <div className="mb-4 text-sm font-semibold text-white">NEPSE Index</div>
          <IndexLineChart data={indexSeries} />
        </FintechCard>
        <FintechCard className="p-5">
          <div className="mb-4 text-sm font-semibold text-white">Daily Movers</div>
          <GainersLosersBar data={movers} />
        </FintechCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StockMovesTable title="Top Gainers" rows={gainers} />
        <StockMovesTable title="Top Losers" rows={losers} />
      </div>
    </div>
  )
}

