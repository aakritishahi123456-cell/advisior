import Link from 'next/link'

export const metadata = {
  title: 'FinSathi AI — Financial Profile Setup',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fintech-primary to-fintech-secondary flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          <span className="text-lg font-bold text-fintech-primary">FinSathi AI</span>
        </Link>
        {children}
      </div>
    </div>
  )
}

