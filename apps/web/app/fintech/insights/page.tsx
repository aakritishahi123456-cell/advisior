import FintechCard from '@/components/fintech/ui/FintechCard'
import InsightFeed from '@/components/fintech/widgets/InsightFeed'

const items = [
  {
    tag: 'Trend' as const,
    title: 'Daily NEPSE Summary: Uptrend intact',
    text: 'Market breadth improved with banking leading; volatility remains contained across most sectors.',
    time: 'Today 6:05 PM',
  },
  {
    tag: 'Opportunity' as const,
    title: 'Potential rotation into hydro',
    text: 'Selective accumulation and rising volumes suggest a rotation into hydropower after consolidation.',
    time: 'Today 6:05 PM',
  },
  {
    tag: 'Risk' as const,
    title: 'Abnormal moves flagged',
    text: 'A small set of symbols moved beyond normal ranges. Consider limiting single-stock exposure.',
    time: 'Today 6:05 PM',
  },
]

export default function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">AI Insights</h1>
        <p className="text-sm text-slate-400">
          Natural language daily reports + structured JSON. This is designed to be fed by your Insight Generation Agent.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FintechCard className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold text-white">Daily NEPSE Summary</div>
          <div className="mt-2 whitespace-pre-wrap rounded-3xl border border-white/10 bg-black/25 p-4 text-sm text-slate-200">
            Market direction: UP{'\n'}
            Top gainers: HBL (+3.20%), NABIL (+2.40%), NLIC (+1.90%){'\n'}
            Top losers: NRIC (-1.70%), UPPER (-1.10%), NTC (-0.60%){'\n\n'}
            Notable sectors: Commercial Banks (+1.8%), Hydropower (+0.6%), Insurance (+0.4%)
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Connect this page to `GET /api/v1/insights/daily` or your `insight_reports` API to render live content.
          </div>
        </FintechCard>

        <InsightFeed items={items} />
      </div>
    </div>
  )
}

