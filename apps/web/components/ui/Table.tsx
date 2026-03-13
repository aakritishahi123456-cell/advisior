'use client'

import Card from './Card'

export type Column<T> = {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

export default function Table<T extends { id?: string | number }>({
  title,
  description,
  columns,
  rows,
  emptyState = 'No data available.',
}: {
  title?: string
  description?: string
  columns: Column<T>[]
  rows: T[]
  emptyState?: string
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border">
          {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
          {description && <p className="text-xs text-text-tertiary mt-1">{description}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-secondary">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-primary divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-sm text-text-tertiary">
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id ?? index} className="hover:bg-surface-secondary/60">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 whitespace-nowrap text-sm text-text-primary ${col.className || ''}`}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
