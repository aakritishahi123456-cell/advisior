'use client'

import { useState } from 'react'
import { BookOpen, Play, Clock, ChevronRight, Search, Star, TrendingUp, Calculator, CreditCard, PiggyBank } from 'lucide-react'

const categories = ['All', 'Investing', 'Loans', 'Budgeting', 'Taxes', 'Retirement']

const lessons = [
  { 
    id: 1,
    title: 'Getting Started with NEPSE', 
    category: 'Investing', 
    duration: '15 min', 
    level: 'Beginner',
    thumbnail: '📈',
    views: 12500,
    rating: 4.8
  },
  { 
    id: 2,
    title: 'Understanding Stock Analysis', 
    category: 'Investing', 
    duration: '20 min', 
    level: 'Intermediate',
    thumbnail: '📊',
    views: 8900,
    rating: 4.7
  },
  { 
    id: 3,
    title: 'Home Loan Basics', 
    category: 'Loans', 
    duration: '12 min', 
    level: 'Beginner',
    thumbnail: '🏠',
    views: 15200,
    rating: 4.9
  },
  { 
    id: 4,
    title: 'EMI Calculator Guide', 
    category: 'Loans', 
    duration: '8 min', 
    level: 'Beginner',
    thumbnail: '🧮',
    views: 11200,
    rating: 4.6
  },
  { 
    id: 5,
    title: 'Personal Budgeting 101', 
    category: 'Budgeting', 
    duration: '18 min', 
    level: 'Beginner',
    thumbnail: '💰',
    views: 9800,
    rating: 4.8
  },
  { 
    id: 6,
    title: 'Tax Planning for Beginners', 
    category: 'Taxes', 
    duration: '25 min', 
    level: 'Intermediate',
    thumbnail: '📋',
    views: 7600,
    rating: 4.5
  },
  { 
    id: 7,
    title: 'Retirement Planning Guide', 
    category: 'Retirement', 
    duration: '30 min', 
    level: 'Advanced',
    thumbnail: '🎯',
    views: 5400,
    rating: 4.9
  },
  { 
    id: 8,
    title: 'Mutual Funds Explained', 
    category: 'Investing', 
    duration: '22 min', 
    level: 'Intermediate',
    thumbnail: '📚',
    views: 8100,
    rating: 4.7
  },
]

const quickLearnings = [
  { icon: TrendingUp, title: 'Stock Market Basics', progress: 100 },
  { icon: Calculator, title: 'Understanding EMI', progress: 75 },
  { icon: CreditCard, title: 'Loan Types Explained', progress: 50 },
  { icon: PiggyBank, title: 'Savings Strategies', progress: 25 },
]

export default function LearningCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLessons = lessons.filter(lesson => {
    const matchesCategory = selectedCategory === 'All' || lesson.category === selectedCategory
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#635BFF]/10 rounded-xl">
          <BookOpen className="w-6 h-6 text-[#635BFF]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-sm text-gray-500">Financial education powered by FinSathi</p>
        </div>
      </div>

      {/* Quick Learning */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#635BFF] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLearnings.map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#00D4AA] rounded-full" style={{ width: `${item.progress}%` }} />
              </div>
              <p className="text-xs text-white/70 mt-2">{item.progress}% complete</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0A2540] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLessons.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-32 bg-gradient-to-br from-[#635BFF]/20 to-[#00D4AA]/20 flex items-center justify-center text-5xl">
              {lesson.thumbnail}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-[#635BFF]/10 text-[#635BFF] text-xs font-medium rounded-lg">
                  {lesson.category}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                  lesson.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                  lesson.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {lesson.level}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#635BFF] transition-colors">
                {lesson.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{lesson.rating}</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-[#635BFF]/10 text-[#635BFF] font-medium rounded-xl hover:bg-[#635BFF] hover:text-white transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Start Learning
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No lessons found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
