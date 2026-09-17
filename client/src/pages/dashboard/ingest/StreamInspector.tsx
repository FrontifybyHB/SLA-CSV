import { Card } from '@/shared/ui/Card'
import { StatusBadge } from '@/shared/ui/StatusBadge'

interface StreamInspectorProps {
  fileName?: string
  node?: string
  progressPct?: number
  bufferLabel?: string
  transferRate?: string
  parsedRecords?: string
}

const DEFAULTS = {
  fileName: 'telemetry_prod_2025-05-12.csv',
  node: 'NODE #409-TX',
  progressPct: 68,
  bufferLabel: '142 / 210 MB',
  transferRate: '24.2 MB/s',
  parsedRecords: '1,480,200',
} as const

export function StreamInspector(props: StreamInspectorProps) {
  const { fileName, node, progressPct, bufferLabel, transferRate, parsedRecords } = {
    ...DEFAULTS,
    ...props,
  }

  return (
    <Card
      title="STREAM INSPECTOR // ACTIVE"
      actions={<StatusBadge tone="success">Ingesting {progressPct}%</StatusBadge>}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-label-md">
        <span className="font-semibold text-sla-on-surface truncate">{fileName}</span>
        <span className="text-sla-outline whitespace-nowrap">{node}</span>
      </div>

      <div className="h-[0.625rem] mt-3 border border-sla-outline-variant rounded-full bg-sla-surface overflow-hidden">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label="Ingestion progress"
          className="h-full rounded-full bg-sla-primary-container transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-label-md">
        <div className="min-w-0 p-2 border border-sla-outline-variant rounded-sm bg-sla-surface">
          <span className="block font-sla text-label-sm font-medium uppercase tracking-wider text-sla-outline">Buffer Size</span>
          <span className="block mt-0.5 font-semibold truncate text-sla-on-surface">{bufferLabel}</span>
        </div>
        <div className="min-w-0 p-2 border border-sla-outline-variant rounded-sm bg-sla-surface">
          <span className="block font-sla text-label-sm font-medium uppercase tracking-wider text-sla-outline">Transfer Rate</span>
          <span className="block mt-0.5 font-semibold truncate text-sla-primary">{transferRate}</span>
        </div>
        <div className="min-w-0 p-2 border border-sla-outline-variant rounded-sm bg-sla-surface">
          <span className="block font-sla text-label-sm font-medium uppercase tracking-wider text-sla-outline">Parsed Records</span>
          <span className="block mt-0.5 font-semibold truncate text-sla-tertiary-container">{parsedRecords}</span>
        </div>
      </div>
    </Card>
  )
}