import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center" role="status">
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="text-base text-sla-secondary max-w-[44ch]">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}