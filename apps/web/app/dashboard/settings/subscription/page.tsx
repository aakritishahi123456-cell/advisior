'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, endpoints } from '@/lib/apiClient'

type Provider = {
  provider: 'KHALTI' | 'ESEWA'
  enabled: boolean
  currency: string
}

type SubscriptionStatus = {
  plan: 'FREE' | 'PRO'
  isActive: boolean
  expiresAt: string | null
  reportsThisMonth: {
    used: number
    limit: number | null
    remaining: number | null
  }
}

type PaymentSession = {
  transactionId: string
  provider: 'KHALTI' | 'ESEWA'
  plan: 'PRO'
  amount: number
  paymentUrl: string
  checkoutId: string
  formData?: Record<string, string>
}

const planFeatures = [
  'Unlimited company reports',
  'Advanced financial analysis',
  'Verified Nepal payment gateways',
  'Secure upgrade with server-side verification',
]

export default function SettingsSubscriptionPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingProvider, setProcessingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [statusResponse, providersResponse] = await Promise.all([
          api.get<SubscriptionStatus>(endpoints.subscriptions.current),
          api.get<Provider[]>(endpoints.payments.providers),
        ])

        if (statusResponse.success && statusResponse.data) {
          setStatus(statusResponse.data)
        }

        if (providersResponse.success && providersResponse.data) {
          setProviders(providersResponse.data)
        }
      } catch (apiError: any) {
        setError(apiError?.error || 'Failed to load subscription details')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const startUpgrade = async (provider: 'KHALTI' | 'ESEWA') => {
    setProcessingProvider(provider)
    setError(null)

    try {
      const response = await api.post<PaymentSession>(endpoints.payments.initiate, {
        provider,
        plan: 'PRO',
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to initiate payment')
      }

      if (provider === 'ESEWA' && response.data.formData) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = response.data.paymentUrl

        Object.entries(response.data.formData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
        return
      }

      window.location.href = response.data.paymentUrl
    } catch (apiError: any) {
      const message = apiError?.error || 'Failed to initiate payment'
      setError(message)
      toast.error(message)
      setProcessingProvider(null)
    }
  }

  const enabledProviders = providers.filter((provider) => provider.enabled)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upgrade to Pro with verified Khalti or eSewa payment flow.
            </p>
          </div>
          <div className="rounded-2xl bg-fintech-secondary/10 px-4 py-2 text-sm font-semibold text-fintech-secondary">
            Secure payment verification
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subscription status...
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current plan</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{status?.plan || 'FREE'}</p>
              <p className="mt-2 text-sm text-gray-600">
                {status?.isActive && status?.expiresAt
                  ? `Active until ${new Date(status.expiresAt).toLocaleDateString()}`
                  : 'Free plan with monthly report limit'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly reports</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {status?.reportsThisMonth.used ?? 0}
                {status?.reportsThisMonth.limit === null ? ' / unlimited' : ` / ${status?.reportsThisMonth.limit ?? 2}`}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {status?.reportsThisMonth.remaining === null
                  ? 'Pro users can generate unlimited reports.'
                  : `${status?.reportsThisMonth.remaining ?? 0} reports remaining this month.`}
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-fintech-secondary/10 via-white to-fintech-accent/10 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-fintech-secondary">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-xl font-bold">Upgrade to Pro</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Redirect to Khalti or eSewa, verify the callback on the backend, and only then activate the paid plan.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-5">
            <p className="text-4xl font-bold text-gray-900">NPR 999<span className="text-lg text-gray-500">/month</span></p>
            <ul className="mt-5 space-y-3">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-5">
            <div className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-fintech-primary" />
              <p className="font-semibold">Choose payment gateway</p>
            </div>

            <div className="mt-4 space-y-3">
              {enabledProviders.map((provider) => {
                const busy = processingProvider === provider.provider

                return (
                  <button
                    key={provider.provider}
                    type="button"
                    onClick={() => void startUpgrade(provider.provider)}
                    disabled={busy || Boolean(processingProvider) || status?.plan === 'PRO'}
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-fintech-secondary hover:bg-fintech-secondary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{provider.provider === 'KHALTI' ? 'Khalti' : 'eSewa'}</p>
                      <p className="text-xs text-gray-500">{provider.currency} secure checkout</p>
                    </div>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin text-fintech-secondary" /> : <ShieldCheck className="h-4 w-4 text-fintech-secondary" />}
                  </button>
                )
              })}

              {enabledProviders.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No payment gateways are enabled in the current environment.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
