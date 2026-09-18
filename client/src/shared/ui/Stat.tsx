import type { ReactNode } from 'react'

export interface StatProps {
  label: string
  value: ReactNode
  hint?: string
}

/**
 * Single dynamic stat row: label on top, value below.
 * Replaces every hand-rolled <div><dt><dd> block so all
 * metadata grids share one size (14px label / 15px value).
 */
export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-sla-text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.9375rem] font-semibold leading-[1.4] text-sla-on-surface" title={hint ?? undefined}>
        {value}
      </dd>
    </div>
  )
}
