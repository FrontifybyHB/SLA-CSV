import { memo } from 'react'
import { formatCount } from '@/shared/lib/format'

interface BreachPaginationProps {
  total: number
  page: number
  pages: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}

/** Real pagination driven by the logs endpoint total. */
export const BreachPagination = memo(function BreachPagination({
  total,
  page,
  pages,
  pageSize,
  onPrev,
  onNext,
}: BreachPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
      <div className="font-mono text-[11px] text-sla-secondary">
        Showing <span className="text-sla-on-surface font-semibold">{from} - {to}</span> of{' '}
        <span className="text-sla-on-surface font-semibold">{formatCount(total)}</span> breach records
        <span aria-hidden="true" className="text-sla-outline-variant"> | </span>
        <span>
          Page <span className="text-sla-on-surface font-semibold">{page}</span> of{' '}
          <span className="text-sla-on-surface font-semibold">{pages}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[12px]">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="border border-sla-outline-variant bg-white px-2.5 py-1 text-sla-secondary rounded-[5px] transition-all duration-150 hover:text-sla-on-surface hover:border-sla-outline disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
        >
          Prev
        </button>
        <span aria-current="page" className="border border-sla-primary-container bg-sla-primary-container text-sla-on-primary font-semibold px-2.5 py-1 rounded-[5px] select-none">
          {page}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={onNext}
          className="border border-sla-outline-variant bg-white px-2.5 py-1 text-sla-secondary rounded-[5px] transition-all duration-150 hover:text-sla-on-surface hover:border-sla-outline disabled:opacity-40 disabled:cursor-not-allowed font-medium whitespace-nowrap active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
        >
          Next
        </button>
      </div>
    </div>
  )
})
