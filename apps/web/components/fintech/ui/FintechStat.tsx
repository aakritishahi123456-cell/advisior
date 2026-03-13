import { clsx } from 'clsx'

export default function FintechStat({
  label,
  value,
  subValue,
  delta,
  deltaLabel = 'today',
  tone = 'neutral',
}: {
  label: string
  value: string
  subValue?: string
  delta?: number
  deltaLabel?: string
  tone?: 'up' | 'down' | 'neutral'
}) {
  const toneStyles = {
    up: 'text-gains',
    down: 'text-losses',
    neutral: 'text-slate-300',
  }[tone]

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
          {subValue ? <div className="mt-1 text-xs text-slate-400">{subValue}</div> : null}
        </div>
        {delta !== undefined ? (
          <div className={clsx('text-xs font-semibold', toneStyles)}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}% <span className="font-normal text-slate-500">{deltaLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
