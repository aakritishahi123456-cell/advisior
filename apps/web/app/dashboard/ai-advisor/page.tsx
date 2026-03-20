'use client'

import { useState } from 'react'
import { Bot, Send, Sparkles, FileText, Calculator, TrendingUp, CreditCard, Lightbulb } from 'lucide-react'
import { api } from '@/lib/apiClient'

const quickQuestions = [
  { icon: TrendingUp, text: 'Which NEPSE stocks are strong right now?' },
  { icon: Calculator, text: 'Should I take a home loan or wait?' },
  { icon: CreditCard, text: 'How should I invest 1 lakh NPR?' },
  { icon: FileText, text: 'Analyze Nabil Bank financials' },
  { icon: Lightbulb, text: 'What are the best dividend stocks?' },
  { icon: Sparkles, text: 'Create a retirement plan for me' },
]

const chatHistory = [
  {
    type: 'user',
    message: 'Which NEPSE stocks are strong right now?',
    time: '2:30 PM'
  },
  {
    type: 'ai',
    message: 'Based on current market analysis, here are the strongest NEPSE stocks:',
    insights: [
      { title: 'NABIL', reason: 'Strong capital adequacy ratio (CAR at 14.2%), improving NIM trends, and solid dividend yield of 12.3%' },
      { title: 'HBL', reason: 'Highest market cap in banking sector, stable earnings growth, and strong liquidity' },
      { title: 'NICBL', reason: 'Undervalued with P/E of 7.2, below sector average, with good dividend yield' },
    ],
    recommendation: 'Consider building positions in these Tier-1 banks for long-term growth. Diversify across multiple banks to reduce concentration risk.',
    time: '2:31 PM'
  },
  {
    type: 'user',
    message: 'How should I invest 1 lakh NPR for 5 years?',
    time: '2:35 PM'
  },
  {
    type: 'ai',
    message: 'Here is a balanced investment strategy for NPR 100,000 over 5 years:',
    allocations: [
      { percentage: 50, amount: 50000, investment: 'Fixed Deposits', reason: 'Safety and guaranteed returns' },
      { percentage: 30, amount: 30000, investment: 'Index Mutual Funds', reason: 'Diversification and lower risk' },
      { percentage: 20, amount: 20000, investment: 'Blue-chip Stocks', reason: 'Capital appreciation potential' },
    ],
    expectedReturn: 'Estimated annual return: 10-12%',
    time: '2:36 PM'
  },
]

type UserMessage = {
  type: 'user'
  message: string
  time: string
}

type AIMessage = {
  type: 'ai'
  message: string
  time: string
  insights?: Array<{ title: string; reason: string }>
  allocations?: Array<{ percentage: number; amount: number; investment: string; reason: string }>
  recommendation?: string
  expectedReturn?: string
}

type ChatMessage = UserMessage | AIMessage

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const newUserMessage = { type: 'user' as const, message: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages((prev) => [...prev, newUserMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const response = await api.post<{ answer: string }>('/advisor/chat', {
        message: newUserMessage.message,
      })

      if (!response.success || !response.data?.answer) {
        throw new Error(response.error || 'AI Advisor request failed')
      }

      setMessages(prev => [...prev, {
        type: 'ai',
        message: response.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (error: any) {
      const message =
        error?.error ||
        error?.message ||
        'AI Advisor is unavailable right now. Please try again in a moment.'

      setMessages(prev => [...prev, {
        type: 'ai',
        message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-[#635BFF] to-[#00D4AA] rounded-xl">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Financial Advisor</h1>
          <p className="text-sm text-gray-500">Get personalized financial advice powered by AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-[#635BFF]/5 to-[#00D4AA]/5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#635BFF]" />
                <span className="font-semibold text-gray-900">AI Advisor</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Online</span>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.type === 'user' 
                        ? 'bg-[#635BFF] text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>

                    {msg.insights && (
                      <div className="mt-3 space-y-2">
                        {msg.insights.map((insight, i) => (
                          <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl">
                            <p className="font-semibold text-[#635BFF] text-sm">{insight.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{insight.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.allocations && (
                      <div className="mt-3 space-y-2">
                        {msg.allocations.map((alloc, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                            <span className="px-2 py-1 bg-[#635BFF]/10 text-[#635BFF] text-xs font-bold rounded">{alloc.percentage}%</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{alloc.investment}</p>
                              <p className="text-xs text-gray-500">NPR {alloc.amount.toLocaleString()} - {alloc.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.recommendation && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-xs font-semibold text-green-800">Recommendation</p>
                        <p className="text-sm text-green-700 mt-1">{msg.recommendation}</p>
                      </div>
                    )}

                    {msg.expectedReturn && (
                      <div className="mt-3 p-3 bg-[#635BFF]/10 border border-[#635BFF]/20 rounded-xl">
                        <p className="text-sm font-semibold text-[#635BFF]">{msg.expectedReturn}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">{msg.time}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask any financial question..."
                  className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-3 bg-[#635BFF] text-white rounded-xl hover:bg-[#4B44B3] transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Questions</h3>
            <div className="space-y-2">
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(q.text)}
                  className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <q.icon className="w-4 h-4 text-[#635BFF]" />
                  <span className="text-sm text-gray-700">{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#635BFF]/10 to-[#00D4AA]/10 rounded-2xl p-5 border border-[#635BFF]/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#635BFF]" />
              <span className="font-semibold text-gray-900">Pro Tip</span>
            </div>
            <p className="text-sm text-gray-600">Be specific about your financial goals, risk tolerance, and investment timeframe for better personalized advice.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
