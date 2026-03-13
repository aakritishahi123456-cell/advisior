import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react'

export default function SettingsOverviewPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Account</h2>
            <p className="text-sm text-gray-500 mt-1">Update personal details and security preferences.</p>
          </div>
          <Link href="/dashboard/settings/profile" className="text-sm font-semibold text-fintech-secondary hover:underline inline-flex items-center gap-1">
            Edit <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Plan</p>
            <p className="font-bold text-gray-900 mt-1">Pro (Trial)</p>
            <p className="text-xs text-gray-500 mt-1">Upgrade for market signals and optimizer.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Security</p>
            <p className="font-bold text-gray-900 mt-1 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Protected
            </p>
            <p className="text-xs text-gray-500 mt-1">Enable 2FA and alerts.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-fintech-primary to-fintech-secondary rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <p className="font-semibold">Make it personalized</p>
        </div>
        <p className="text-sm text-white/80 mt-2">
          Complete your financial profile to unlock a smarter dashboard, better risk scoring, and tailored plans.
        </p>
        <Link
          href="/dashboard/settings/financial-profile"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-white text-fintech-primary px-4 py-2 text-sm font-semibold hover:bg-white/90"
        >
          Manage financial profile
        </Link>
      </div>
    </div>
  )
}

