'use client'

import Link from 'next/link'
import { 
  Calculator, 
  TrendingUp, 
  Wallet, 
  ArrowRight, 
  CheckCircle,
  Star,
  Menu,
  X,
  Bot,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const features = [
  {
    icon: Calculator,
    title: 'Loan Simulator',
    description: 'Calculate EMI, compare loans, and find the best deals.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Analysis',
    description: 'AI-powered analysis of Nepali stocks and financial reports.',
  },
  {
    icon: Wallet,
    title: 'Financial Planning',
    description: 'Personalized financial strategies for your goals.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Analyze finances',
    description: 'Connect your accounts or input your financial details.',
  },
  {
    number: '02',
    title: 'AI generates insights',
    description: 'Our AI analyzes your data and market conditions.',
  },
  {
    number: '03',
    title: 'Make smarter decisions',
    description: 'Get personalized recommendations to grow your wealth.',
  },
]

const testimonials = [
  {
    name: 'Raj Kumar',
    role: 'Investor',
    content: 'FinSathi helped me optimize my portfolio and increase returns by 23%. The AI advisor is incredibly insightful.',
  },
  {
    name: 'Priya Sharma',
    role: 'Business Owner',
    content: 'The loan simulator saved me lakhs in interest. Best financial tool for Nepal.',
  },
  {
    name: 'Bibek Tamang',
    role: 'Professional',
    content: 'Market insights and AI predictions have transformed my investment strategy.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#635BFF] flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-[#0A2540]">FinSathi AI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#0A2540] transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-[#0A2540] transition-colors font-medium">
                How It Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-[#0A2540] transition-colors font-medium">
                Pricing
              </a>
              <Link href="/auth/login" className="text-gray-600 hover:text-[#0A2540] transition-colors font-medium">
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="px-5 py-2.5 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#1a3a5c] transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 mt-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-600 font-medium">How It Works</a>
                <a href="#pricing" className="text-gray-600 font-medium">Pricing</a>
                <Link href="/auth/login" className="text-gray-600 font-medium">Login</Link>
                <Link href="/auth/register" className="px-5 py-2.5 bg-[#0A2540] text-white font-semibold rounded-xl text-center">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540] via-[#1a3a5c] to-[#635BFF] opacity-95" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[#635BFF]/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-[#00D4AA]/20 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-8 border border-white/20">
              <Sparkles className="w-4 h-4 text-[#00D4AA] mr-2" />
              <span className="text-white/90 text-sm font-medium">AI-Powered Financial Intelligence</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              AI-Powered Financial Intelligence{' '}
              <span className="bg-gradient-to-r from-[#00D4AA] to-cyan-400 bg-clip-text text-transparent">
                for Nepal
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Make smarter financial decisions with AI-driven investment insights, loan analysis, and portfolio planning.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/register" 
                className="px-8 py-4 bg-[#00D4AA] text-[#0A2540] font-bold rounded-xl hover:bg-[#00E5B8] transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto px-6 -mt-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
            <div className="p-1">
              <div className="bg-gray-50 rounded-xl p-6 md:p-8">
                {/* Dashboard Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Portfolio Value', value: 'NPR 2,450,000', change: '+12.5%', up: true },
                    { label: 'Monthly Returns', value: 'NPR 45,200', change: '+8.2%', up: true },
                    { label: 'Total Investments', value: 'NPR 1,850,000', change: '+5.3%', up: true },
                    { label: 'YTD Returns', value: '18.7%', change: '+2.1%', up: true },
                  ].map((metric, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{metric.value}</p>
                      <p className={`text-xs font-semibold ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.change}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Chart Placeholder */}
                <div className="h-32 md:h-48 bg-gradient-to-r from-[#635BFF]/5 to-[#00D4AA]/5 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Interactive Financial Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow Your Wealth
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful AI tools designed specifically for the Nepalese market
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-[#635BFF]/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#8B85FF] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and let AI do the heavy lifting
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-50 rounded-2xl p-8 text-center h-full">
                  <div className="text-5xl font-bold text-[#635BFF]/20 mb-4">{step.number}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-[#635BFF] rounded-full flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advisor Section */}
      <section className="py-20 bg-[#0A2540]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Meet Your AI Financial{' '}
                <span className="bg-gradient-to-r from-[#00D4AA] to-cyan-400 bg-clip-text text-transparent">
                  Advisor
                </span>
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Ask questions about investments, loans, or financial planning. Get instant, personalized advice powered by AI trained on Nepalese market data.
              </p>
              <div className="space-y-4">
                {[
                  'Personalized investment strategies',
                  'Real-time market analysis',
                  'Loan optimization recommendations',
                  'Risk assessment and management',
                ].map((item, i) => (
                  <div key={i} className="flex items-center text-white/90">
                    <CheckCircle className="w-5 h-5 text-[#00D4AA] mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Chat Interface */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="ml-4 text-sm text-gray-500 flex items-center">
                    <Bot className="w-4 h-4 mr-1" /> AI Advisor
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#635BFF] text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                    <p className="text-sm">Should I invest in Nepali banking stocks right now?</p>
                  </div>
                </div>
                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-md">
                    <p className="text-sm">
                      Based on current market analysis, Nepali banking sector shows strong fundamentals. Consider:
                    </p>
                    <ul className="mt-2 text-xs space-y-1 text-gray-600">
                      <li>• Focus on Tier-1 banks with strong capital ratios</li>
                      <li>• Consider dividend yield for passive income</li>
                      <li>• Monitor regulatory changes in Q2</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-gray-600">
              See what our users say about FinSathi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0A2540] to-[#635BFF]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Making Smarter Financial Decisions Today
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Join thousands of Nepalese investors making smarter financial decisions with AI.
          </p>
          <Link 
            href="/auth/register" 
            className="inline-flex items-center px-8 py-4 bg-[#00D4AA] text-[#0A2540] font-bold rounded-xl hover:bg-[#00E5B8] transition-all shadow-lg hover:shadow-xl"
          >
            Create Free Account
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2540] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#635BFF] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold text-white">FinSathi AI</span>
              </div>
              <p className="text-white/60 text-sm">
                AI-powered financial intelligence platform for Nepal.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-10 pt-8 text-center text-white/40">
            <p>&copy; 2024 FinSathi AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
