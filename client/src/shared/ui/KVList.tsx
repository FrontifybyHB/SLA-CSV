import type { ReactNode } from 'react'

export type KVItem = [label: string, value: ReactNode]

/**
 * Uniform label/value rows used by every diagnostics-style panel.
 * One row style everywhere — no more mismatched paddings per panel.
 */
export function KVList({ items }: { items: KVItem[] }) {
  return (
    <dl className="flex flex-col gap-2 font-mono text-label-md">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 p-2 rounded-sm bg-sla-surface border border-sla-outline-variant/60 min-w-0"
        >
          <dt className="text-sla-secondary shrink-0">{label}</dt>
          <dd className="font-semibold text-sla-on-surface text-right truncate min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
