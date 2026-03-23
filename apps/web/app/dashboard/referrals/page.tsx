'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, Gift, Loader2, Share2, Users } from 'lucide-react'
import { api, endpoints } from '@/lib/apiClient'

type ReferralStatus = {
  referralCode: string
  referralLink: string
  totalReferrals: number
  convertedReferrals: number
  conversionsUntilReward: number
  totalPremiumDaysEarned: number
  activeRewardExpiresAt: string | null
  referrals: Array<{
    id: string
    inviteeEmail: string
    convertedAt: string
  }>
  rewards: Array<{
    id: string
    premiumDays: number
    grantedAt: string
    expiresAt: string | null
    triggerCount: number
  }>
}

export default function ReferralsPage() {
  const [status, setStatus] = useState<ReferralStatus | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadStatus = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.get<ReferralStatus>(endpoints.referral.status)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load referral status')
      }

      setStatus(response.data)
    } catch (apiError: any) {
      setError(apiError?.error || 'Failed to load referral status')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const handleCopy = async () => {
    if (!status?.referralLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(status.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Unable to copy referral link.')
    }
  }

  const handleUseReferral = async () => {
    if (!referralCode.trim()) {
      setError('Enter a referral code first.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await api.post(endpoints.referral.use, { code: referralCode })
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply referral code')
      }

      setMessage('Referral code applied successfully.')
      setReferralCode('')
      await loadStatus()
    } catch (apiError: any) {
      setError(apiError?.error || 'Failed to apply referral code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#fff7ed_52%,#ecfccb_100%)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <Share2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Referral Growth</h1>
            <p className="mt-1 text-sm text-slate-600">
              Invite friends to FinSathi. Every 3 successful referrals unlock 7 free Pro days.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading referral dashboard...
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}

      {status ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Users className="h-4 w-4" />
                Conversions
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{status.convertedReferrals}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Until next reward</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{status.conversionsUntilReward}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Gift className="h-4 w-4" />
                Pro days earned
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{status.totalPremiumDaysEarned}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Active reward expires</p>
              <p className="mt-3 text-lg font-bold text-slate-900">
                {status.activeRewardExpiresAt ? new Date(status.activeRewardExpiresAt).toLocaleDateString() : 'No active bonus'}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Your referral link</h2>
              <p className="mt-1 text-sm text-slate-500">Share this link with friends to track conversions automatically.</p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referral code</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{status.referralCode}</p>
                <p className="mt-3 break-all text-sm text-slate-600">{status.referralLink}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleCopy()}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy invite link'}
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Use a referral code</h2>
              <p className="mt-1 text-sm text-slate-500">Already got an invite? Apply the code here once.</p>

              <input
                type="text"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 focus:border-amber-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => void handleUseReferral()}
                disabled={isSubmitting}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Apply referral code
              </button>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Successful invites</h2>
              <div className="mt-4 space-y-3">
                {status.referrals.length > 0 ? (
                  status.referrals.map((referral) => (
                    <div key={referral.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="font-medium text-slate-900">{referral.inviteeEmail}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Converted on {new Date(referral.convertedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No successful referrals yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Reward history</h2>
              <div className="mt-4 space-y-3">
                {status.rewards.length > 0 ? (
                  status.rewards.map((reward) => (
                    <div key={reward.id} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <p className="font-medium text-slate-900">{reward.premiumDays} Pro days earned</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Triggered at {reward.triggerCount} referrals on {new Date(reward.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No rewards granted yet.</p>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}
