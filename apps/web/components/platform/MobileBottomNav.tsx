'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { primaryNavigation } from './navigation'

const mobileItems = [
  primaryNavigation[0], // Dashboard
  primaryNavigation[1], // Loan Simulator
  primaryNavigation[2], // Investment Research
  primaryNavigation[3], // Portfolio
  primaryNavigation[5], // AI Advisor
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {mobileItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${
                isActive ? 'text-fintech-primary' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-fintech-primary' : 'text-gray-500'}`} />
              <span className="leading-none">{item.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

