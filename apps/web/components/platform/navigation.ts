import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  PieChart,
  BarChart3,
  Brain,
  Target,
  BookOpen,
  Settings,
  Shield,
  Zap,
  SlidersHorizontal,
} from 'lucide-react'

import type { ComponentType } from 'react'

export type NavItem = {
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: string
}

export const primaryNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Loan Simulator', href: '/dashboard/loan-simulator', icon: Calculator },
  { name: 'Investment Research', href: '/dashboard/investment-research', icon: TrendingUp },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: PieChart },
  { name: 'Market Intelligence', href: '/dashboard/market-intelligence', icon: BarChart3 },
  { name: 'AI Advisor', href: '/dashboard/ai-advisor', icon: Brain, badge: 'AI' },
  { name: 'Financial Planning', href: '/dashboard/financial-planning', icon: Target },
  { name: 'Learning Center', href: '/dashboard/learning', icon: BookOpen },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export const secondaryNavigation: NavItem[] = [
  { name: 'Market Signals', href: '/dashboard/market-signals', icon: Zap, badge: 'AI' },
  { name: 'Portfolio Optimizer', href: '/dashboard/portfolio-optimizer', icon: SlidersHorizontal, badge: 'Pro' },
  { name: 'Admin', href: '/dashboard/admin', icon: Shield },
]
