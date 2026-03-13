'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Sparkles, RefreshCw } from 'lucide-react'

const topGainers = [
  { symbol: 'HBL', name: 'HBL Bank', price: 520, change: 3.2, volume: '1.5M' },
  { symbol: 'NABIL', name: 'Nabil Bank', price: 490, change: 2.4, volume: '1.2M' },
  { symbol: 'NICBL', name: 'NIC Asia', price: 380, change: 1.8, volume: '890K' },
  { symbol: 'BOK', name: 'Bank of Kathmandu', price: 310, change: 1.1, volume: '320K' },
  { symbol: 'NMB', name: 'NMB Bank', price: 280, change: 0.9, volume: '250K' },
]

const topLosers = [
  { symbol: 'NLIC', name: 'NLIC Bank', price: 145, change: -3.5, volume: '180K' },
  { symbol: 'PLIC', name: 'Prime Life Insurance', price: 320, change: -2.8, volume: '95K' },
  { symbol: 'SHL', name: 'Soaltee Hotel', price: 185, change: -2.1, volume: '85K' },
  { symbol: 'NHPC', name: 'National Hydro', price: 285, change: -1.2, volume: '180K' },
  { symbol: 'API', name: 'API Power', price: 420, change: -0.8, volume: '250K' },
]

const sectorPerformance = [
  { sector: 'Banking', change: 1.8, marketCap: '450B' },
  { sector: 'Hydropower', change: -0.5, marketCap: '180B' },
  { sector: 'Finance', change: 1.2, marketCap: '85B' },
  { sector: 'Hotels', change: 0.9, marketCap: '42B' },
  { sector: 'Trading', change: -1.5, marketCap: '28B' },
  { sector: 'Manufacturing', change: 0.4, marketCap: '65B' },
]

const marketSignals = [
  { type: 'BUY', symbol: 'NABIL', reason: 'Strong fundamentals, improving NIM', confidence: 85 },
  { type: 'HOLD', symbol: 'HBL', reason: 'Fair valuation, wait for dip', confidence: 70 },
  { type: 'BUY', symbol: 'NICBL', reason: 'Undervalued, high dividend yield', confidence: 78 },
]

export default function MarketIntelligencePage() {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated] = useState(new Date())

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#635BFF]/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-[#635BFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
            <p className="text-sm text-gray-500">Real-time NEPSE market data and AI insights</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0A2540] to-[#635BFF] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Market Summary</span>
        </div>
        <p className="text-lg mb-4">NEPSE index showing positive momentum today. Banking sector leading gains with increased trading volume. Continue to monitor regulatory developments.</p>
        <div className="flex gap-6">
          <div>
            <p className="text-sm opacity-70">NEPSE Index</p>
            <p className="text-xl font-bold">2,845.32</p>
            <p className="text-sm text-green-400">+0.82%</p>
          </div>
          <div>
            <p className="text-sm opacity-70">Total Volume</p>
            <p className="text-xl font-bold">NPR 4.2B</p>
            <p className="text-sm text-green-400">+15.3%</p>
          </div>
          <div>
            <p className="text-sm opacity-70">Market Status</p>
            <p className="text-xl font-bold">Open</p>
            <p className="text-sm">Closes 3:00 PM</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Gainers</h3>
          </div>
          <div className="space-y-3">
            {topGainers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{stock.symbol}</p>
                  <p className="text-xs text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">NPR {stock.price}</p>
                  <p className="text-sm text-green-600 font-medium">+{stock.change}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Losers</h3>
          </div>
          <div className="space-y-3">
            {topLosers.map((stock, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{stock.symbol}</p>
                  <p className="text-xs text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">NPR {stock.price}</p>
                  <p className="text-sm text-red-600 font-medium">{stock.change}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Sector Performance</h3>
          <div className="space-y-3">
            {sectorPerformance.map((sector, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sector.change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    {sector.change >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sector.sector}</p>
                    <p className="text-xs text-gray-500">NPR {sector.marketCap}</p>
                  </div>
                </div>
                <span className={`font-semibold ${sector.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sector.change >= 0 ? '+' : ''}{sector.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#635BFF]" />
            <h3 className="text-lg font-semibold text-gray-900">AI Trading Signals</h3>
          </div>
          <a href="/dashboard/market-signals" className="text-sm font-medium text-[#635BFF] hover:underline">
            View all
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {marketSignals.map((signal, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${signal.type === 'BUY' ? 'bg-green-100 text-green-700' : signal.type === 'SELL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {signal.type}
                </span>
                <span className="text-xs text-gray-500">{signal.confidence}% confidence</span>
              </div>
              <p className="font-bold text-gray-900 mb-1">{signal.symbol}</p>
              <p className="text-sm text-gray-600">{signal.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
