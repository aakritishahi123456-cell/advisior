import Skeleton from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-36 mt-2" />
            <Skeleton className="h-4 w-24 mt-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3 mt-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

