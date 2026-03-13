import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function SettingsSubscriptionPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900">Subscription</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and billing preferences.</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Current plan</p>
            <p className="font-bold text-gray-900 mt-1">Pro</p>
            <p className="text-xs text-gray-500 mt-1">Renews on Apr 11, 2026</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500">Payment method</p>
            <p className="font-bold text-gray-900 mt-1">Card •••• 4242</p>
            <p className="text-xs text-gray-500 mt-1">Update billing in the next release</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-fintech-secondary to-fintech-accent text-white rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <p className="font-semibold">Upgrade for advanced analytics</p>
        </div>
        <p className="text-sm text-white/80 mt-2">
          Investor plan unlocks Market Signals and Portfolio Optimizer with deeper AI reasoning.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-white text-fintech-primary px-4 py-2 text-sm font-semibold hover:bg-white/90"
        >
          Compare plans
        </Link>
      </div>
    </div>
  )
}

