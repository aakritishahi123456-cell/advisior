'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  CandlestickChart,
  LineChart,
  PieChart,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/fintech', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/fintech/market', label: 'Market Overview', icon: CandlestickChart },
  { href: '/fintech/stocks', label: 'Stock Analysis', icon: LineChart },
  { href: '/fintech/portfolio', label: 'Portfolio Builder', icon: PieChart },
  { href: '/fintech/insights', label: 'AI Insights', icon: Sparkles },
]

export default function FintechShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,91,255,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,212,170,0.10),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-xl md:block">
          <div className="px-5 py-5">
            <Link href="/fintech" className="group flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fintech-secondary to-fintech-accent shadow-glow" />
              <div>
                <div className="text-sm font-semibold tracking-tight">FinSathi AI</div>
                <div className="text-xs text-slate-400">Fintech Dashboard</div>
              </div>
            </Link>
          </div>

          <nav className="px-3 pb-6">
            {navItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'bg-white/10 text-white shadow-soft'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={clsx('h-4 w-4', active ? 'text-fintech-accent' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mx-4 mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4">
            <div className="text-xs font-semibold text-slate-200">Live Mode</div>
            <div className="mt-1 text-xs text-slate-400">
              Connect this UI to your `/api/v1/*` endpoints to render real NEPSE data.
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="md:hidden">
                <Link href="/fintech" className="text-sm font-semibold">
                  FinSathi AI
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-slate-100">Autonomous Financial Intelligence</div>
                <div className="text-xs text-slate-400">NEPSE • Portfolio • AI insights</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Dark fintech UI
                </span>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
