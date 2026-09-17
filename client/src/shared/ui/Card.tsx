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
    <section className={['bg-sla-surface border border-sla-border rounded-lg shadow-[0_1px_2px_rgb(16_24_40/0.06),0_1px_3px_rgb(16_24_40/0.1)]', className ?? ''].filter(Boolean).join(' ')}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-sla-border">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
          {actions}
        </header>
      ) : null}
      <div className={flush ? 'p-0' : 'p-5'}>{children}</div>
    </section>
  )
}