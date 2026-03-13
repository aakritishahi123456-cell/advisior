import { clsx } from 'clsx'

export default function FintechCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-premium',
        className
      )}
    >
      {children}
    </div>
  )
}

