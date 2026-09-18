import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import type { DatasetSummary } from '@/features/datasets'

interface StreamInspectorProps {
  dataset: DatasetSummary | null
}

/**
 * Shows the most recently selected import — real counters from the API,
 * never fabricated stream numbers.
 */
export function StreamInspector({ dataset }: StreamInspectorProps) {
  if (!dataset) {
    return (
      <Card
        title="LATEST IMPORT"
        actions={<StatusBadge tone="neutral">Idle</StatusBadge>}
      >
        <p className="font-mono text-label-md text-sla-secondary leading-relaxed">
          No imports yet. Upload a CSV above — its observation, slot and issue
          counters will appear here.
        </p>
      </Card>
    )
  }

  const hasIssues = dataset.issueCount > 0

  return (
    <Card
      title="LATEST IMPORT"
      actions={
        <StatusBadge tone={hasIssues ? 'warning' : 'success'}>
          {hasIssues ? `${dataset.issueCount} issues` : 'Clean'}
        </StatusBadge>
      }
    >
      <div className="flex items-center justify-between gap-2 font-mono text-label-md min-w-0">
        <span className="font-semibold text-sla-on-surface truncate min-w-0">{dataset.filename}</span>
        <span className="text-sla-outline whitespace-nowrap shrink-0">{formatUtcDateTime(dataset.uploadedAt)}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 font-mono text-label-md min-w-0">
        <div className="min-w-0 p-2 sm:p-2.5 border border-sla-outline-variant/70 rounded-lg bg-sla-surface transition-shadow duration-200 hover:shadow-sm">
          <span className="block font-sla text-[10px] sm:text-label-sm font-medium uppercase tracking-wider text-sla-outline overflow-wrap-anywhere">Observations</span>
          <span className="block mt-0.5 font-semibold truncate text-sla-on-surface">{formatCount(dataset.observationCount)}</span>
        </div>
        <div className="min-w-0 p-2 sm:p-2.5 border border-sla-outline-variant/70 rounded-lg bg-sla-surface transition-shadow duration-200 hover:shadow-sm">
          <span className="block font-sla text-[10px] sm:text-label-sm font-medium uppercase tracking-wider text-sla-outline">Slots</span>
          <span className="block mt-0.5 font-semibold truncate text-sla-primary">{formatCount(dataset.slotCount)}</span>
        </div>
        <div className="min-w-0 p-2 sm:p-2.5 border border-sla-outline-variant/70 rounded-lg bg-sla-surface transition-shadow duration-200 hover:shadow-sm">
          <span className="block font-sla text-[10px] sm:text-label-sm font-medium uppercase tracking-wider text-sla-outline">Agents</span>
          <span className="block mt-0.5 font-semibold truncate">{formatCount(dataset.agentCount)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-sla-outline-variant/50">
        <Link
          to={`/dashboard?dataset=${encodeURIComponent(dataset.datasetId)}`}
          className="font-mono text-label-md text-sla-primary font-semibold hover:underline"
        >
          Open SLA overview for this dataset →
        </Link>
      </div>
    </Card>
  )
}
