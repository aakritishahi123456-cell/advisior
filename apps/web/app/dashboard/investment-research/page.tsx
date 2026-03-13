'use client'

import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Filter, Star, Building2, Landmark, ArrowUpRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const sectors = ['All', 'Banking', 'Hydropower', 'Hotels', 'Manufacturing', 'Finance', 'Trading']

const companies = [
  { 
    symbol: 'NABIL', 
    name: 'Nabil Bank Limited', 
    sector: 'Banking',
    price: 490, 
    change: 2.4,
    volume: '1.2M',
    marketCap: '45.2B',
    pe: 8.5,
    dividend: 12.3,
    rating: 4.5
  },
  { 
    symbol: 'NICBL', 
    name: 'NIC Asia Bank Ltd', 
    sector: 'Banking',
    price: 380, 
    change: 1.8,
    volume: '890K',
    marketCap: '32.1B',
    pe: 7.2,
    dividend: 10.5,
    rating: 4.2
  },
  { 
    symbol: 'PRVU', 
    name: 'Prabhu Bank Ltd', 
    sector: 'Banking',
    price: 245, 
    change: -0.5,
    volume: '450K',
    marketCap: '28.5B',
    pe: 6.8,
    dividend: 8.2,
    rating: 3.8
  },
  { 
    symbol: 'HBL', 
    name: 'HBL Bank Limited', 
    sector: 'Banking',
    price: 520, 
    change: 3.2,
    volume: '1.5M',
    marketCap: '52.8B',
    pe: 9.1,
    dividend: 14.2,
    rating: 4.7
  },
  { 
    symbol: 'BOK', 
    name: 'Bank of Kathmandu', 
    sector: 'Banking',
    price: 310, 
    change: 1.1,
    volume: '320K',
    marketCap: '22.4B',
    pe: 7.5,
    dividend: 9.8,
    rating: 3.9
  },
  { 
    symbol: 'NHPC', 
    name: 'National Hydro Power Co.', 
    sector: 'Hydropower',
    price: 285, 
    change: -1.2,
    volume: '180K',
    marketCap: '18.2B',
    pe: 12.5,
    dividend: 5.2,
    rating: 3.5
  },
  { 
    symbol: 'API', 
    name: 'Api Power Company', 
    sector: 'Hydropower',
    price: 420, 
    change: 0.8,
    volume: '250K',
    marketCap: '25.6B',
    pe: 11.2,
    dividend: 6.8,
    rating: 4.0
  },
  { 
    symbol: 'SHL', 
    name: 'Soaltee Hotel Ltd', 
    sector: 'Hotels',
    price: 185, 
    change: 2.1,
    volume: '95K',
    marketCap: '8.5B',
    pe: 15.8,
    dividend: 3.2,
    rating: 3.7
  },
]

export default function InvestmentResearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('All')
  const [sortBy, setSortBy] = useState('marketCap')

  const filteredCompanies = companies
    .filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSector = selectedSector === 'All' || company.sector === selectedSector
      return matchesSearch && matchesSector
    })
    .sort((a, b) => {
      if (sortBy === 'marketCap') return b.marketCap.localeCompare(a.marketCap)
      if (sortBy === 'price') return b.price - a.price
      if (sortBy === 'change') return b.change - a.change
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#635BFF]/10 rounded-xl">
          <TrendingUp className="w-6 h-6 text-[#635BFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Research</h1>
          <p className="text-sm text-gray-500">Explore NEPSE companies and analyze investments</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies or stock symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            />
          </div>

          {/* Sector Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sectors.map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSector === sector
                    ? 'bg-[#0A2540] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <option value="marketCap">Market Cap</option>
            <option value="price">Price</option>
            <option value="change">Change %</option>
          </select>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-[#635BFF]/10 to-[#00D4AA]/10 rounded-2xl p-4 border border-[#635BFF]/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#635BFF]/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-[#635BFF]" />
          </div>
          <div>
            <p className="font-medium text-gray-900">AI Market Insight</p>
            <p className="text-sm text-gray-600">Banking sector showing strong momentum with improved NIM trends. Consider diversifying across Tier-1 banks.</p>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((company) => (
          <Link
            key={company.symbol}
            href={`/dashboard/investment-research/${company.symbol}`}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#635BFF] hover:shadow-md transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#635BFF]/10 to-[#00D4AA]/10 rounded-xl flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-[#635BFF]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{company.symbol}</h3>
                  <p className="text-xs text-gray-500">{company.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-gray-900">{company.rating}</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">NPR {company.price}</p>
              <div className={`flex items-center gap-1 ${company.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {company.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">{company.change >= 0 ? '+' : ''}{company.change}%</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Volume</p>
                <p className="text-sm font-semibold text-gray-900">{company.volume}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">P/E</p>
                <p className="text-sm font-semibold text-gray-900">{company.pe}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Div %</p>
                <p className="text-sm font-semibold text-gray-900">{company.dividend}%</p>
              </div>
            </div>

            {/* Sector Tag */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="px-2 py-1 bg-[#635BFF]/10 text-[#635BFF] text-xs font-medium rounded-lg">
                {company.sector}
              </span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#635BFF] transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No companies found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
