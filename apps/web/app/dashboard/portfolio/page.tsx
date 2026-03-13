'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PieChart, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Download, Filter, RefreshCw, SlidersHorizontal } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'

const DashboardPerformanceChart = dynamic(
  () => import('@/components/charts/DashboardPerformanceChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)
const DashboardAllocationChart = dynamic(
  () => import('@/components/charts/DashboardAllocationChart'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> }
)

const holdings = [
  { symbol: 'NABIL', name: 'Nabil Bank', shares: 500, avgPrice: 420, currentPrice: 490, change: 2.4 },
  { symbol: 'NICBL', name: 'NIC Asia Bank', shares: 300, avgPrice: 350, currentPrice: 380, change: 1.8 },
  { symbol: 'HBL', name: 'HBL Bank', shares: 200, avgPrice: 480, currentPrice: 520, change: 3.2 },
  { symbol: 'PRVU', name: 'Prabhu Bank', shares: 400, avgPrice: 255, currentPrice: 245, change: -0.5 },
  { symbol: 'BOK', name: 'Bank of Kathmandu', shares: 150, avgPrice: 290, currentPrice: 310, change: 1.1 },
]

const allocation = [
  { name: 'Stocks', value: 75, color: '#635BFF' },
  { name: 'Mutual Funds', value: 15, color: '#00D4AA' },
  { name: 'Fixed Deposits', value: 10, color: '#0A2540' },
]

const performanceHistory = [
  { month: 'Jan', value: 2100000 },
  { month: 'Feb', value: 2180000 },
  { month: 'Mar', value: 2150000 },
  { month: 'Apr', value: 2240000 },
  { month: 'May', value: 2350000 },
  { month: 'Jun', value: 2450000 },
]

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = useState('6M')

  const totalValue = holdings.reduce((acc, h) => acc + h.shares * h.currentPrice, 0)
  const totalCost = holdings.reduce((acc, h) => acc + h.shares * h.avgPrice, 0)
  const totalGain = totalValue - totalCost
  const gainPercent = ((totalGain / totalCost) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#635BFF]/10 rounded-xl">
            <PieChart className="w-6 h-6 text-[#635BFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
            <p className="text-sm text-gray-500">Track your investments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <a href="/dashboard/portfolio-optimizer" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            <SlidersHorizontal className="w-4 h-4" />
            Optimize
          </a>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0A2540] text-white rounded-xl text-sm font-medium hover:bg-[#1a3a5c]">
            <Filter className="w-4 h-4" />
            Add Holding
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NPR {totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NPR {totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Gain/Loss</p>
          <div className={`flex items-center gap-1 mt-1 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span className="text-2xl font-bold">NPR {Math.abs(totalGain).toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Return</p>
          <div className={`flex items-center gap-1 mt-1 ${Number(gainPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(gainPercent) >= 0 ? <TrendingUp className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span className="text-2xl font-bold">{gainPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeRange(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    timeRange === period
                      ? 'bg-[#0A2540] text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <DashboardPerformanceChart data={performanceHistory} />
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Allocation</h3>
          <div className="h-48">
            <DashboardAllocationChart data={allocation} />
          </div>
          <div className="space-y-2 mt-4">
            {allocation.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holdings.map((holding) => {
                const value = holding.shares * holding.currentPrice
                const cost = holding.shares * holding.avgPrice
                const gain = value - cost
                const gainPercent = ((gain / cost) * 100).toFixed(1)
                return (
                  <tr key={holding.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{holding.symbol}</p>
                        <p className="text-xs text-gray-500">{holding.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">{holding.shares}</td>
                    <td className="px-6 py-4 text-right text-gray-900">NPR {holding.avgPrice}</td>
                    <td className="px-6 py-4 text-right text-gray-900">NPR {holding.currentPrice}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">NPR {value.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      NPR {Math.abs(gain).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${Number(gainPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(gainPercent) >= 0 ? '+' : ''}{gainPercent}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
