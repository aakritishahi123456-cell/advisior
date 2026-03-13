export default function Skeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] ${className}`}
    />
  )
}

