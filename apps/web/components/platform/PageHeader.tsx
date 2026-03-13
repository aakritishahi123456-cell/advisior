import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type Breadcrumb = { label: string; href?: string }

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-gray-700 font-medium">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              </div>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

