import type { ReactNode } from 'react'

export type StatusBadgeTone = 'success' | 'info' | 'danger' | 'warning' | 'neutral'

const toneClasses: Record<StatusBadgeTone, string> = {
  success: 'border-sla-success bg-sla-success-soft text-sla-success',
  info: 'border-sla-primary bg-sla-primary-soft text-sla-primary',
  danger: 'border-sla-danger bg-sla-danger-soft text-sla-danger',
  warning: 'border-sla-warning bg-sla-warning-soft text-sla-warning',
  neutral: 'border-sla-border-strong bg-sla-surface text-sla-text-muted',
}

interface StatusBadgeProps {
  tone?: StatusBadgeTone
  children: ReactNode
}

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span className={`inline-block shrink-0 px-2 py-0.5 border rounded-sm bg-sla-bg text-label-sm font-semibold uppercase tracking-wider whitespace-nowrap ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}