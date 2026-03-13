import { clsx } from 'clsx'

export type StockMove = {
  symbol: string
  name: string
  price: number
  changePct: number
  sector?: string
}

export default function StockMovesTable({
  title,
  rows,
}: {
  title: string
  rows: StockMove[]
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-slate-400">NEPSE • Daily</div>
      </div>
      <div className="px-2 pb-2">
        {rows.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between rounded-2xl px-3 py-3 hover:bg-white/5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-white">{r.symbol}</div>
                <div className="truncate text-xs text-slate-400">{r.name}</div>
              </div>
              {r.sector ? <div className="mt-1 text-xs text-slate-500">{r.sector}</div> : null}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-100">NPR {r.price.toFixed(2)}</div>
              <div
                className={clsx(
                  'text-xs font-semibold',
                  r.changePct >= 0 ? 'text-gains' : 'text-losses'
                )}
              >
                {r.changePct >= 0 ? '+' : ''}
                {r.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

