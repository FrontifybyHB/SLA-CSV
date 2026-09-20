import type { ReactNode } from 'react'

export interface MetricCardProps {
  title: string
  /** One-line plain-language explainer shown under the title. */
  hint?: string
  /** Badge on the right of the title row. */
  badge?: ReactNode
  children: ReactNode
  /** Footer row separated by a top border. */
  footer?: ReactNode
  className?: string
}

/**
 * Uniform card for every dashboard metric block: same title row, same
 * padding, same footer treatment — so cards never look over/under-sized
 * next to each other. Fills its grid cell height.
 */
export function MetricCard({ title, hint, badge, children, footer, className }: MetricCardProps) {
  return (
    <section
      className={[
        'h-full flex flex-col bg-white border border-sla-outline-variant/70 rounded-xl p-4 shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgb(16_24_40/0.08)]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center justify-between gap-2 pb-2 min-w-0">
        <h2 className="font-mono text-label-md font-bold tracking-wider truncate min-w-0">{title}</h2>
        {badge ? <span className="shrink-0">{badge}</span> : null}
      </div>
      {hint ? <p className="text-body-sm text-sla-secondary pb-3">{hint}</p> : null}
      <div className="flex-1 flex flex-col gap-3 min-w-0">{children}</div>
      {footer ? (
        <div className="pt-3 mt-3 border-t border-sla-outline-variant/50 font-mono text-label-sm text-sla-secondary min-w-0 overflow-wrap-anywhere">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
