import { Fragment, type ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Skeleton } from './Skeleton'

export type DataTableAlign = 'left' | 'center' | 'right'

const alignClass: Record<DataTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * One column definition. Add as many as you need — header, alignment
 * and cell content are all data-driven via `render`.
 */
export interface DataTableColumn<T> {
  /** Stable key for the <th>. */
  key: string
  /** Column heading. Keep it short; one or two words. */
  header: ReactNode
  align?: DataTableAlign
  /** Extra classes for the <th> (e.g. `hidden md:table-cell` to collapse on mobile). */
  headerClassName?: string
  /** Extra classes for every <td> in this column (e.g. `whitespace-nowrap`). */
  cellClassName?: string
  render: (row: T, index: number) => ReactNode
}

export interface DataTableError {
  message: string
  requestId?: string
  onRetry: () => void
  retryLabel?: string
  title?: string
}

export interface DataTableProps<T> {
  /** Card title, e.g. "Datasets". */
  title: ReactNode
  /** Badge pinned to the right of the title row. */
  badge?: ReactNode
  /** Secondary line under the header (filter state, window, hints). */
  meta?: ReactNode
  columns: Array<DataTableColumn<T>>
  rows: T[]
  rowKey: (row: T, index: number) => string
  /** Extra classes per body row (zebra, selection, severity tint). */
  rowClassName?: (row: T, index: number) => string | undefined
  /**
   * Expandable detail row. When `expandedKey` matches a row's key, the
   * returned node renders full-width directly beneath that row.
   */
  expandedKey?: string | null
  renderExpanded?: (row: T, index: number) => ReactNode
  /** Loading state — skeleton rows, same padding as content. */
  pending?: boolean
  pendingRows?: number
  /** Error state — retry panel, same padding as content. */
  error?: DataTableError | null
  /** Empty state copy. */
  emptyTitle?: string
  emptyDescription?: string
  /** Footer bar (counts, pagination, links). */
  footer?: ReactNode
  className?: string
}

/**
 * Single dynamic table for the whole app — inventory, breach logs,
 * overview previews, or anything else row-shaped.
 *
 * - One bordered, rounded card shell (no double borders when nested).
 * - Cells share one padding scale (`px-3 sm:px-4`, `py-2.5 sm:py-3`).
 * - `overflow-x-auto` scrolls only when columns truly don't fit;
 *   long content wraps instead of forcing a fixed `min-w`.
 * - Loading / error / empty states are built in with equal padding.
 */
export function DataTable<T>({
  title,
  badge,
  meta,
  columns,
  rows,
  rowKey,
  rowClassName,
  expandedKey,
  renderExpanded,
  pending = false,
  pendingRows = 4,
  error = null,
  emptyTitle = 'Nothing here yet.',
  emptyDescription,
  footer,
  className,
}: DataTableProps<T>) {
  return (
    <section
      className={[
        'overflow-hidden bg-white border border-sla-outline-variant/70 rounded-xl shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgb(16_24_40/0.08)]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3 sm:px-5 border-b border-sla-outline-variant/60">
        <h2 className="flex min-w-0 items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-sla-on-surface">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-sla-primary-container" />
          <span className="truncate">{title}</span>
        </h2>
        {badge ? <span className="shrink-0">{badge}</span> : null}
        {meta ? (
          <p className="w-full font-mono text-[11px] leading-relaxed text-sla-text-muted">{meta}</p>
        ) : null}
      </header>

      {pending ? (
        <div className="flex flex-col gap-2.5 px-4 py-4 sm:px-5" aria-label="Loading table rows">
          {Array.from({ length: pendingRows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="px-4 py-4 sm:px-5">
          <ErrorState
            title={error.title ?? 'Could not load rows.'}
            message={error.message}
            requestId={error.requestId}
            onRetry={error.onRetry}
            retryLabel={error.retryLabel ?? 'Retry'}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-6 sm:px-5">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{typeof title === 'string' ? title : 'Data table'}</caption>
            <thead>
              <tr className="border-b border-sla-outline-variant/60 bg-sla-surface">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={[
                      'px-3 sm:px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-sla-secondary whitespace-nowrap',
                      alignClass[col.align ?? 'left'],
                      col.headerClassName ?? '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const key = rowKey(row, index)
                const extra = rowClassName?.(row, index)
                const expanded = renderExpanded && expandedKey === key
                return (
                  <Fragment key={key}>
                    <tr
                      className={[
                        'border-t border-sla-outline-variant/40 transition-colors duration-150 first:border-t-0 hover:bg-sla-primary/[0.03]',
                        extra ?? '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={[
                            'px-3 sm:px-4 py-2.5 sm:py-3 text-[0.8125rem] leading-relaxed text-sla-on-surface align-middle',
                            alignClass[col.align ?? 'left'],
                            col.cellClassName ?? '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {col.render(row, index)}
                        </td>
                      ))}
                    </tr>
                    {expanded ? (
                      <tr className="border-t border-sla-outline-variant/40 bg-sla-surface/60">
                        <td colSpan={columns.length} className="px-3 py-3 sm:px-4 sm:py-4">
                          {renderExpanded(row, index)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sla-outline-variant/60 bg-sla-surface px-4 py-2.5 sm:px-5 font-mono text-[11px] text-sla-secondary">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
