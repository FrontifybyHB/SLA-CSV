import type { ReactNode } from 'react'

export interface CardProps {
  title?: string
  actions?: ReactNode
  className?: string
  flush?: boolean
  children: ReactNode
}

export function Card({ title, actions, className, flush = false, children }: CardProps) {
  return (
    <section className={['bg-white border border-sla-outline-variant/70 rounded-xl shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgb(16_24_40/0.08)]', className ?? ''].filter(Boolean).join(' ')}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 border-b border-sla-outline-variant/60">
          {title ? <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-sla-on-surface">{title}</h2> : null}
          {actions}
        </header>
      ) : null}
      <div className={flush ? 'p-0' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  )
}