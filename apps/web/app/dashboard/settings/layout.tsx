'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PageHeader from '@/components/platform/PageHeader'

const items = [
  { name: 'Overview', href: '/dashboard/settings' },
  { name: 'Profile', href: '/dashboard/settings/profile' },
  { name: 'Financial Profile', href: '/dashboard/settings/financial-profile' },
  { name: 'Notifications', href: '/dashboard/settings/notifications' },
  { name: 'Subscription', href: '/dashboard/settings/subscription' },
  { name: 'Security', href: '/dashboard/settings/security' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, financial profile, and platform preferences."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <div className="grid lg:grid-cols-[260px,1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="bg-white border border-gray-200 rounded-2xl p-2">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-fintech-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="lg:hidden overflow-x-auto">
            <div className="inline-flex gap-2">
              {items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap px-3 py-2 rounded-xl text-sm font-semibold border ${
                      isActive ? 'bg-fintech-primary text-white border-fintech-primary' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

