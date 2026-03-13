import Link from 'next/link'
import { CheckCircle2, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: 'NPR 0',
    description: 'For getting started with the platform.',
    features: ['Dashboard basics', 'Loan simulator', 'Learning center', 'Limited AI prompts'],
    cta: { label: 'Start free', href: '/auth/register' },
  },
  {
    name: 'Pro',
    price: 'NPR 999/mo',
    description: 'For serious personal finance planning.',
    features: ['Unlimited AI advisor', 'Advanced loan comparisons', 'Portfolio tracking', 'Goal planning modules'],
    highlight: true,
    cta: { label: 'Go Pro', href: '/auth/register' },
  },
  {
    name: 'Investor',
    price: 'NPR 2,499/mo',
    description: 'For active market participants and analysts.',
    features: ['Company analysis pages', 'Market signals (BUY/HOLD/SELL)', 'Portfolio optimizer', 'Priority insights panel'],
    cta: { label: 'Become Investor', href: '/auth/register' },
  },
]

export const metadata = {
  title: 'FinSathi AI — Pricing',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fintech-secondary/10 text-fintech-secondary font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Transparent pricing
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Plans that scale with your ambition</h1>
          <p className="mt-3 text-lg text-gray-600">
            Choose a plan to unlock AI insights, analytics, and professional fintech dashboards.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-8 shadow-sm ${
                plan.highlight
                  ? 'border-fintech-secondary bg-gradient-to-b from-fintech-secondary/10 to-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                {plan.highlight && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-fintech-secondary text-white">Most Popular</span>
                )}
              </div>
              <p className="text-gray-600 mt-2">{plan.description}</p>
              <div className="mt-6">
                <p className="text-4xl font-bold text-gray-900">{plan.price}</p>
                <p className="text-xs text-gray-500 mt-2">Cancel anytime. No hidden fees.</p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-fintech-secondary text-white hover:bg-fintech-secondary-dark'
                    : 'bg-fintech-primary text-white hover:bg-fintech-primary-light'
                }`}
              >
                {plan.cta.label}
              </Link>
              <p className="text-xs text-gray-500 mt-3">
                By subscribing you agree to our terms and secure billing policy.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-gray-200 bg-gray-50 p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Need a custom plan for your team?</h3>
            <p className="text-gray-600 mt-2">Get admin analytics, usage monitoring, and SLA support.</p>
          </div>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-2xl bg-fintech-primary text-white px-6 py-3 font-semibold hover:bg-fintech-primary-light"
          >
            Contact sales
          </Link>
        </div>
      </div>
    </div>
  )
}

