'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Activity,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2
} from 'lucide-react'

// Mock data for demonstration
const mockPredictions = [
  { symbol: 'NABIL', direction: 'UP', probability: 72, confidence: 0.85, price: 625, target: 680 },
  { symbol: 'NICA', direction: 'UP', probability: 68, confidence: 0.78, price: 492, target: 530 },
  { symbol: 'SCB', direction: 'DOWN', probability: 45, confidence: 0.65, price: 308, target: 290 },
  { symbol: 'MBL', direction: 'UP', probability: 61, confidence: 0.72, price: 385, target: 410 },
  { symbol: 'BOK', direction: 'UP', probability: 55, confidence: 0.58, price: 245, target: 265 },
]

const mockSignals = [
  { symbol: 'NABIL', signal: 'STRONG_BUY', rsi: 42, sma: 'ABOVE_20', confidence: 85 },
  { symbol: 'NICA', signal: 'BUY', rsi: 38, sma: 'ABOVE_20', confidence: 72 },
  { symbol: 'SCB', signal: 'SELL', rsi: 72, sma: 'BELOW_20', confidence: 68 },
  { symbol: 'MBL', signal: 'HOLD', rsi: 55, sma: 'NEAR_20', confidence: 55 },
]

const mockPortfolio = [
  { symbol: 'NABIL', weight: 28, value: 28000, change: 2.5 },
  { symbol: 'NICA', weight: 24, value: 24000, change: 1.8 },
  { symbol: 'SCB', weight: 18, value: 18000, change: -1.2 },
  { symbol: 'MBL', weight: 15, value: 15000, change: 0.9 },
  { symbol: 'BOK', weight: 15, value: 15000, change: 3.2 },
]

const mockSectors = [
  { name: 'Banking', change: 2.3, volume: 45000000 },
  { name: 'Hydro', change: -1.2, volume: 12000000 },
  { name: 'Mutual Fund', change: 0.8, volume: 8000000 },
  { name: 'Hotel', change: 1.5, volume: 5500000 },
]

function PredictionCard({ prediction }) {
  const isUp = prediction.direction === 'UP'
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg">{prediction.symbol}</span>
        <span className={`flex items-center gap-1 text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {isUp ? 'UP' : 'DOWN'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Probability</span>
          <span className="font-medium">{prediction.probability}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${prediction.probability}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mt-3">
          <span className="text-gray-500">Current</span>
          <span className="font-medium">Rs. {prediction.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Target</span>
          <span className="font-medium">Rs. {prediction.target}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Confidence</span>
          <span className="font-medium">{Math.round(prediction.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

function SignalCard({ signal }) {
  const getSignalColor = (signal) => {
    if (signal.includes('BUY')) return 'bg-green-100 text-green-700'
    if (signal.includes('SELL')) return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold">{signal.symbol}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignalColor(signal.signal)}`}>
          {signal.signal}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">RSI</span>
          <p className="font-medium">{signal.rsi}</p>
        </div>
        <div>
          <span className="text-gray-500">SMA 20</span>
          <p className="font-medium">{signal.sma}</p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Confidence</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
            <span className="font-medium">{signal.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortfolioChart() {
  const total = mockPortfolio.reduce((sum, p) => sum + p.value, 0)
  let cumulative = 0
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {mockPortfolio.map((item, idx) => {
              const startAngle = (cumulative / total) * 100
              cumulative += item.weight
              const endAngle = (cumulative / total) * 100
              const radius = 45
              const circumference = 2 * Math.PI * radius
              const strokeDashoffset = circumference - (endAngle / 100) * circumference
              const strokeDasharray = circumference - ((endAngle - startAngle) / 100) * circumference
              
              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="20"
                  stroke={`currentColor`}
                  className={colors[idx]}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-((startAngle / 100) * circumference)}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">Rs. 100K</p>
              <p className="text-xs text-gray-500">Total Value</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {mockPortfolio.map((item, idx) => (
          <div key={item.symbol} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[idx]}`} />
              <span>{item.symbol}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{item.weight}%</span>
              <span className={item.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {item.change >= 0 ? '+' : ''}{item.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectorPerformance() {
  return (
    <div className="space-y-3">
      {mockSectors.map((sector, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="font-medium">{sector.name}</span>
          <div className="flex items-center gap-3">
            <span className={`${sector.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sector.change >= 0 ? '+' : ''}{sector.change}%
            </span>
            <div className="w-24 bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${sector.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(sector.change) * 20, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ title, value, change, icon: Icon }) {
  const isPositive = change >= 0
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span>{isPositive ? '+' : ''}{change}%</span>
        <span className="text-gray-400">vs last week</span>
      </div>
    </div>
  )
}

export default function ResearchDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Research Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time market intelligence powered by AI</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Market Sentiment" 
          value="BULLISH" 
          change={15} 
          icon={Brain} 
        />
        <MetricCard 
          title="Active Signals" 
          value="12" 
          change={8} 
          icon={Target} 
        />
        <MetricCard 
          title="Predictions Accuracy" 
          value="72%" 
          change={5} 
          icon={Activity} 
        />
        <MetricCard 
          title="Portfolio Return" 
          value="+12.5%" 
          change={2.3} 
          icon={TrendingUp} 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Predictions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Predictions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                AI Price Predictions
              </h2>
              <span className="text-sm text-gray-500">5-day horizon</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockPredictions.map(prediction => (
                <PredictionCard key={prediction.symbol} prediction={prediction} />
              ))}
            </div>
          </div>

          {/* Trading Signals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Trading Signals
              </h2>
              <span className="text-sm text-gray-500">Technical Analysis</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockSignals.map(signal => (
                <SignalCard key={signal.symbol} signal={signal} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portfolio Allocation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-green-600" />
              Portfolio Allocation
            </h2>
            <PortfolioChart />
          </div>

          {/* Sector Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Sector Performance
            </h2>
            <SectorPerformance />
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-4">AI Confidence Score</h3>
            <div className="text-4xl font-bold mb-2">85%</div>
            <p className="text-blue-200 text-sm">Based on 1,247 data points</p>
            <div className="mt-4 pt-4 border-t border-blue-500">
              <div className="flex justify-between text-sm">
                <span>Model Accuracy</span>
                <span>72%</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Last Updated</span>
                <span>2 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
