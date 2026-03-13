'use client'

import { useMemo, useState } from 'react'
import FintechCard from '@/components/fintech/ui/FintechCard'
import IndexLineChart from '@/components/fintech/charts/IndexLineChart'
import { Search } from 'lucide-react'

const sampleSeries = [
  { date: 'Mon', value: 480 },
  { date: 'Tue', value: 486 },
  { date: 'Wed', value: 483 },
  { date: 'Thu', value: 492 },
  { date: 'Fri', value: 490 },
]

const universe = [
  { symbol: 'NABIL', name: 'Nabil Bank', sector: 'Commercial Banks', risk: 41, pe: 13.2, roe: 16.4 },
  { symbol: 'HBL', name: 'Himalayan Bank', sector: 'Commercial Banks', risk: 44, pe: 12.1, roe: 15.1 },
  { symbol: 'NLIC', name: 'Nepal Life', sector: 'Insurance', risk: 47, pe: 14.8, roe: 13.5 },
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Others', risk: 32, pe: 10.4, roe: 22.0 },
]

export default function StockAnalysisPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(universe[0])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return universe
    return universe.filter((x) => x.symbol.toLowerCase().includes(q) || x.name.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Stock Analysis</h1>
        <p className="text-sm text-slate-400">
          Search a symbol, review trend + risk, and see fundamentals. Connect to your analysis endpoints for live data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FintechCard className="p-5 lg:col-span-1">
          <div className="mb-3 text-sm font-semibold text-white">Search</div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or company..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-fintech-secondary/60"
            />
          </div>
          <div className="mt-4 space-y-2">
            {filtered.map((row) => (
              <button
                key={row.symbol}
                onClick={() => setSelected(row)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  selected.symbol === row.symbol
                    ? 'border-fintech-secondary/40 bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{row.symbol}</div>
                  <div className="text-xs text-slate-400">{row.sector}</div>
                </div>
                <div className="mt-1 text-xs text-slate-400">{row.name}</div>
              </button>
            ))}
          </div>
        </FintechCard>

        <FintechCard className="p-5 lg:col-span-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{selected.symbol}</div>
              <div className="text-xs text-slate-400">{selected.name}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Risk: {selected.risk}/100
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                P/E: {selected.pe}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                ROE: {selected.roe}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <IndexLineChart data={sampleSeries} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-slate-400">Signal</div>
              <div className="mt-2 text-sm font-semibold text-fintech-accent">HOLD</div>
              <div className="mt-1 text-xs text-slate-500">Waiting for confirmation</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-slate-400">Momentum</div>
              <div className="mt-2 text-sm font-semibold text-white">Moderate</div>
              <div className="mt-1 text-xs text-slate-500">5D trend mildly positive</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs text-slate-400">Risk note</div>
              <div className="mt-2 text-sm font-semibold text-white">Diversify</div>
              <div className="mt-1 text-xs text-slate-500">Avoid concentration</div>
            </div>
          </div>
        </FintechCard>
      </div>
    </div>
  )
}

