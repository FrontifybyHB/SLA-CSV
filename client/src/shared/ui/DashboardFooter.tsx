import { memo, type ReactNode } from 'react'

export interface DashboardFooterProps {
  /** Primary context, e.g. dataset name + key numbers. */
  left: ReactNode
  /** Secondary info, e.g. range or links. */
  right?: ReactNode
}

/**
 * Single shared footer bar for every dashboard page.
 * Slim fixed bar: one compact line, truncated, no wrapping clutter.
 */
export const DashboardFooter = memo(function DashboardFooter({ left, right }: DashboardFooterProps) {
  return (
    <footer className="fixed left-0 right-0 bottom-0 z-40 bg-white/95 border-t border-sla-outline-variant/60 backdrop-blur-[8px] font-mono text-[11px] leading-4 text-sla-secondary">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-8 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{left}</span>
        {right ? (
          <span className="hidden min-[420px]:block shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-sla-text-faint max-w-[45%]">
            {right}
          </span>
        ) : null}
      </div>
    </footer>
  )
})
