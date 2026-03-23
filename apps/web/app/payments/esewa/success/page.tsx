'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { api, endpoints } from '@/lib/apiClient'

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export default function EsewaSuccessPage() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerifyState>({ status: 'loading' })

  useEffect(() => {
    const verify = async () => {
      const data = searchParams.get('data')
      const transaction_uuid = searchParams.get('transaction_uuid')
      const total_amount = searchParams.get('total_amount')
      const product_code = searchParams.get('product_code')
      const status = searchParams.get('status')
      const transaction_code = searchParams.get('transaction_code')
      const signed_field_names = searchParams.get('signed_field_names')
      const signature = searchParams.get('signature')

      if (!data && !(transaction_uuid && total_amount && product_code && signed_field_names && signature)) {
        setState({ status: 'error', message: 'Missing eSewa verification payload.' })
        return
      }

      try {
        const response = await api.post(endpoints.payments.verify, {
          provider: 'ESEWA',
          ...(data
            ? { data }
            : {
                transaction_uuid,
                total_amount,
                product_code,
                status,
                transaction_code,
                signed_field_names,
                signature,
              }),
        })

        if (!response.success) {
          throw new Error(response.error || 'Payment verification failed')
        }

        setState({
          status: 'success',
          message: 'Your eSewa payment was verified and your Pro plan is now active.',
        })
      } catch (error: any) {
        setState({
          status: 'error',
          message: error?.error || error?.message || 'Unable to verify eSewa payment.',
        })
      }
    }

    void verify()
  }, [searchParams])

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {state.status === 'loading' ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-fintech-secondary" /> : null}
        {state.status === 'success' ? <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" /> : null}
        {state.status === 'error' ? <XCircle className="mx-auto h-10 w-10 text-red-600" /> : null}

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {state.status === 'loading' ? 'Verifying eSewa payment' : state.status === 'success' ? 'Payment successful' : 'Payment verification failed'}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {state.status === 'loading'
            ? 'Please wait while we confirm your payment with eSewa and activate your plan.'
            : state.message}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/settings/subscription"
            className="inline-flex items-center justify-center rounded-2xl bg-fintech-secondary px-5 py-3 font-semibold text-white hover:bg-fintech-secondary/90"
          >
            Back to subscription
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
