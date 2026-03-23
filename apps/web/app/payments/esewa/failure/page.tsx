'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function EsewaFailurePage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'The payment was cancelled or could not be completed.'

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment not completed</h1>
        <p className="mt-3 text-sm text-gray-600">{reason}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/settings/subscription"
            className="inline-flex items-center justify-center rounded-2xl bg-fintech-secondary px-5 py-3 font-semibold text-white hover:bg-fintech-secondary/90"
          >
            Try again
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            View pricing
          </Link>
        </div>
      </div>
    </main>
  )
}
