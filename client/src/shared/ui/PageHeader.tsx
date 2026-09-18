import type { ReactNode } from 'react'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

/**
 * Single dynamic page heading used by every route.
 * Pass data, get consistent responsive type + alignment.
 * Title clamps: 1.375rem (mobile) → 1.75rem (desktop).
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-[68ch]">
        {eyebrow ? (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sla-primary/20 bg-sla-primary/5 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sla-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[clamp(1.375rem,1.1rem+1.2vw,1.75rem)] font-semibold leading-[1.25] tracking-[-0.015em] text-sla-on-surface text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[62ch] text-[0.875rem] leading-[1.5] text-sla-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  )
}
