'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Bell, Bot, ChevronDown, LogOut, Menu, Search, User, X } from 'lucide-react'
import InsightsPanel from './InsightsPanel'
import MobileBottomNav from './MobileBottomNav'
import { primaryNavigation, secondaryNavigation } from './navigation'

function isInsightsRoute(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/market-intelligence') ||
    pathname.startsWith('/dashboard/investment-research') ||
    pathname.startsWith('/dashboard/portfolio')
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const showInsights = useMemo(() => isInsightsRoute(pathname), [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fintech-primary to-fintech-secondary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="text-lg font-bold text-fintech-primary hidden sm:block">FinSathi AI</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, stocks, or ask AI…"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fintech-secondary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ai-advisor"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-fintech-secondary to-fintech-accent text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Bot className="w-4 h-4" />
              <span>AI Advisor</span>
            </Link>

            <button className="relative p-2 hover:bg-gray-100 rounded-xl" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fintech-secondary to-fintech-accent flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">JS</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">John Smith</p>
                      <p className="text-xs text-gray-500">john@example.com</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings/subscription"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Bot className="w-4 h-4" />
                      Subscription
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="w-64 p-4 space-y-6 overflow-y-auto h-full">
          <div className="space-y-1">
            {primaryNavigation.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-fintech-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Advanced</p>
            <div className="mt-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">{item.badge}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="pt-16 lg:pl-64">
        <div className={`p-4 lg:p-6 ${showInsights ? 'xl:pr-0' : ''}`}>
          <div className={`flex items-start gap-6 ${showInsights ? 'xl:flex' : ''}`}>
            <div className={`min-w-0 flex-1 ${showInsights ? '' : ''}`}>
              <div className="pb-20 md:pb-0">{children}</div>
            </div>
            {showInsights && <InsightsPanel />}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}

