import { memo } from 'react'
import { Icon } from '@/shared/ui/Icon'

export type StatusFilter = 'DOWN' | 'UP' | 'MIXED'

const STATUS_FILTERS: readonly StatusFilter[] = ['DOWN', 'UP', 'MIXED']

interface BreachToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  activeStatuses: StatusFilter[]
  onToggleStatus: (status: StatusFilter) => void
  onClearFilters: () => void
  onExport: () => void
  exportDisabled: boolean
  resultCount: number
  totalCount: number
}

/**
 * Grep box (filters the loaded page client-side), status chips that
 * actually filter, and an Export button that downloads the visible rows
 * as CSV. The mock's dead COLUMNS / LIVE TAIL buttons are gone.
 */
export const BreachToolbar = memo(function BreachToolbar({
  query,
  onQueryChange,
  activeStatuses,
  onToggleStatus,
  onClearFilters,
  onExport,
  exportDisabled,
  resultCount,
  totalCount,
}: BreachToolbarProps) {
  const hasFilters = query.trim() !== '' || activeStatuses.length > 0

  return (
    <div className="p-3 sm:p-3.5 flex flex-col gap-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        <div className="relative flex-1 flex items-center min-w-0">
          <Icon name="search" size={16} className="absolute left-3 text-sla-text-muted pointer-events-none" />
          <label htmlFor="breach-grep" className="sr-only">
            Filter breach logs by service, agent, region, status, or dataset
          </label>
          <input
            id="breach-grep"
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filter by service, agent, region, status…"
            className="w-full bg-white border border-sla-outline-variant/70 rounded-lg text-sla-on-surface font-mono text-[12px] pl-9 pr-3 py-2 shadow-sm focus:border-sla-primary focus:ring-2 focus:ring-sla-primary/20 outline-none transition-all placeholder:text-sla-text-faint truncate"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="bg-white text-sla-secondary hover:text-sla-on-surface hover:bg-sla-surface border border-sla-border-strong px-3 py-1.5 rounded-lg font-mono text-[12px] flex items-center gap-1.5 transition-all duration-150 shadow-sm whitespace-nowrap disabled:opacity-40 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
          >
            <Icon name="download" size={14} />
            <span>EXPORT CSV</span>
          </button>
          <span className="font-mono text-[11px] text-sla-text-muted whitespace-nowrap">
            {resultCount} of {totalCount} rows
          </span>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-sla-outline-variant/50">
        <span className="font-mono text-[10px] text-sla-text-muted uppercase tracking-wider select-none whitespace-nowrap">
          Status:
        </span>
        {STATUS_FILTERS.map((status) => {
          const active = activeStatuses.includes(status)
          return (
            <button
              key={status}
              type="button"
              onClick={() => onToggleStatus(status)}
              aria-pressed={active}
              className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1 ${
                active
                  ? 'bg-sla-primary-container border-sla-primary-container text-white font-semibold shadow-sm'
                  : 'bg-white border-sla-outline-variant text-sla-secondary hover:text-sla-on-surface hover:border-sla-outline'
              }`}
            >
              {status}
            </button>
          )
        })}
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sla-secondary hover:text-sla-primary font-mono text-[11px] ml-1 transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
})
