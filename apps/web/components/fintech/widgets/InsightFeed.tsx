import { Sparkles } from 'lucide-react'

export type InsightItem = {
  tag: 'Opportunity' | 'Risk' | 'Trend'
  title: string
  text: string
  time: string
}

const tagStyles: Record<InsightItem['tag'], string> = {
  Opportunity: 'border-gains/30 bg-gains/10 text-gains',
  Risk: 'border-losses/30 bg-losses/10 text-losses',
  Trend: 'border-fintech-secondary/30 bg-fintech-secondary/10 text-fintech-secondary-light',
}

export default function InsightFeed({ items }: { items: InsightItem[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-white">AI Insights</div>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
            <Sparkles className="h-3.5 w-3.5" />
            LLM
          </span>
        </div>
        <div className="text-xs text-slate-400">Daily summary</div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-xs text-slate-400">{item.text}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${tagStyles[item.tag]}`}>
                  {item.tag}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">{item.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
