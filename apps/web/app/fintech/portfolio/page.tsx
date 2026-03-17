'use client'

import { useMemo, useState } from 'react'
import FintechCard from '@/components/fintech/ui/FintechCard'
import PortfolioDonut from '@/components/fintech/charts/PortfolioDonut'
import { SlidersHorizontal } from 'lucide-react'
import type { AllocationSlice } from '@/components/fintech/charts/PortfolioDonut'

const allocations = {
  conservative: [
    { name: 'Banks', value: 28, color: '#635BFF' },
    { name: 'Insurance', value: 18, color: '#8B85FF' },
    { name: 'Hydro', value: 12, color: '#00D4AA' },
    { name: 'Cash', value: 42, color: '#94A3B8' },
  ],
  moderate: [
    { name: 'Banks', value: 38, color: '#635BFF' },
    { name: 'Hydro', value: 22, color: '#00D4AA' },
    { name: 'Insurance', value: 18, color: '#8B85FF' },
    { name: 'Cash', value: 22, color: '#94A3B8' },
  ],
  aggressive: [
    { name: 'Banks', value: 42, color: '#635BFF' },
    { name: 'Hydro', value: 28, color: '#00D4AA' },
    { name: 'Hotels', value: 12, color: '#38bdf8' },
    { name: 'Insurance', value: 12, color: '#8B85FF' },
    { name: 'Cash', value: 6, color: '#94A3B8' },
  ],
} as const

export default function PortfolioBuilderPage() {
  const [risk, setRisk] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [amount, setAmount] = useState(100000)

  const data = useMemo<readonly AllocationSlice[]>(() => allocations[risk], [risk])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Portfolio Builder</h1>
        <p className="text-sm text-slate-400">
          Create a diversified portfolio using risk-weighted allocation and basic mean-variance heuristics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FintechCard className="p-5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-fintech-accent" />
            <div className="text-sm font-semibold text-white">Inputs</div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400">Risk tolerance</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['conservative', 'moderate', 'aggressive'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setRisk(k)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                      risk === k ? 'border-fintech-secondary/40 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Investment amount (NPR)</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none focus:border-fintech-secondary/60"
              />
              <div className="mt-2 text-xs text-slate-500">
                This UI is demo-ready; connect to `POST /api/v1/portfolio/recommend` for live allocations.
              </div>
            </div>
          </div>
        </FintechCard>

        <FintechCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Recommended allocation</div>
            <div className="text-xs text-slate-400">risk-weighted • diversified</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <PortfolioDonut data={data} />
            </div>
            <div className="space-y-2">
              {data.map((slice) => (
                <div key={slice.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ background: slice.color }} />
                    <div className="text-sm font-semibold text-slate-100">{slice.name}</div>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {slice.value}% <span className="text-xs text-slate-400">≈ NPR {(amount * (slice.value / 100)).toFixed(0)}</span>
                  </div>
                </div>
              ))}

              <div className="mt-3 rounded-3xl border border-white/10 bg-gradient-to-br from-fintech-secondary/10 to-fintech-accent/10 p-4">
                <div className="text-xs text-slate-300">Diversification metrics</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div>
                    <div className="text-white">Holdings</div>
                    <div>{data.length} sectors</div>
                  </div>
                  <div>
                    <div className="text-white">Risk score</div>
                    <div>{risk === 'conservative' ? 32 : risk === 'moderate' ? 42 : 55} / 100</div>
                  </div>
                  <div>
                    <div className="text-white">Concentration</div>
                    <div>{risk === 'aggressive' ? 'High' : 'Moderate'}</div>
                  </div>
                  <div>
                    <div className="text-white">Expected return</div>
                    <div>{risk === 'conservative' ? '10–12%' : risk === 'moderate' ? '12–16%' : '15–20%'} (annual)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FintechCard>
      </div>
    </div>
  )
}
