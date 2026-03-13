'use client'

import { useMemo, useState } from 'react'
import { PieChart as PieIcon, SlidersHorizontal, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import PageHeader from '@/components/platform/PageHeader'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

const PortfolioRecommendedAllocationChart = dynamic(
  () => import('@/components/charts/PortfolioRecommendedAllocationChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

type Holding = { symbol: string; sector: string; value: number }

const initialHoldings: Holding[] = [
  { symbol: 'NABIL', sector: 'Banking', value: 490000 },
  { symbol: 'NICBL', sector: 'Banking', value: 304000 },
  { symbol: 'HBL', sector: 'Banking', value: 260000 },
  { symbol: 'UPPER', sector: 'Hydropower', value: 178000 },
  { symbol: 'SIC', sector: 'Insurance', value: 97500 },
]

const allocationPresets = {
  CONSERVATIVE: [
    { name: 'Fixed income', value: 45, color: '#0A2540' },
    { name: 'Blue‑chip stocks', value: 35, color: '#635BFF' },
    { name: 'Growth stocks', value: 15, color: '#00D4AA' },
    { name: 'Cash', value: 5, color: '#94A3B8' },
  ],
  BALANCED: [
    { name: 'Fixed income', value: 25, color: '#0A2540' },
    { name: 'Blue‑chip stocks', value: 45, color: '#635BFF' },
    { name: 'Growth stocks', value: 25, color: '#00D4AA' },
    { name: 'Cash', value: 5, color: '#94A3B8' },
  ],
  AGGRESSIVE: [
    { name: 'Fixed income', value: 10, color: '#0A2540' },
    { name: 'Blue‑chip stocks', value: 40, color: '#635BFF' },
    { name: 'Growth stocks', value: 45, color: '#00D4AA' },
    { name: 'Cash', value: 5, color: '#94A3B8' },
  ],
} as const

export default function PortfolioOptimizerPage() {
  const [riskTolerance, setRiskTolerance] = useState<keyof typeof allocationPresets>('BALANCED')
  const [holdings] = useState(initialHoldings)

  const totalValue = useMemo(() => holdings.reduce((a, h) => a + h.value, 0), [holdings])
  const recommended = allocationPresets[riskTolerance]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Optimizer"
        description="Optimize allocation based on holdings and risk tolerance."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Portfolio Optimizer' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-fintech-secondary to-fintech-accent hover:opacity-90">
            <Sparkles className="w-4 h-4" />
            Generate recommendations
          </button>
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-fintech-secondary/10">
                  <SlidersHorizontal className="w-5 h-5 text-fintech-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inputs</h2>
                  <p className="text-sm text-gray-500">Tune risk tolerance to adjust the model allocation.</p>
                </div>
              </div>
              <Badge variant="premium">Pro</Badge>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Risk tolerance</label>
                <select className="form-input" value={riskTolerance} onChange={(e) => setRiskTolerance(e.target.value as any)}>
                  <option value="CONSERVATIVE">Conservative</option>
                  <option value="BALANCED">Balanced</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">Matches the profile set during onboarding.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs text-gray-500">Current portfolio value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">NPR {totalValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Based on your tracked holdings.</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Holdings</h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Symbol</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sector</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holdings.map((h) => (
                      <tr key={h.symbol}>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{h.symbol}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{h.sector}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">NPR {h.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">In the full product this is editable and synced to your Portfolio page.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-fintech-secondary/10">
                <PieIcon className="w-5 h-5 text-fintech-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recommended allocation</h2>
                <p className="text-sm text-gray-500">Based on {riskTolerance.toLowerCase()} profile.</p>
              </div>
            </div>

            <div className="h-56 mt-6">
              <PortfolioRecommendedAllocationChart data={recommended} />
            </div>

            <div className="mt-4 space-y-2">
              {recommended.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-fintech-primary to-fintech-secondary text-white rounded-2xl p-6">
            <p className="font-semibold">What changes should you make?</p>
            <p className="text-sm text-white/80 mt-2">
              Reduce concentration risk by limiting any single stock to &lt; 10% of your portfolio. Keep 3–6 months expenses in liquid cash.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
