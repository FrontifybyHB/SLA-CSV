import { memo, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import type { ObservationLog } from '@/features/reporting'

function statusTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  const s = status.toUpperCase()
  if (s === 'UP') return 'success'
  if (s === 'DOWN') return 'danger'
  if (s === 'MIXED') return 'warning'
  return 'neutral'
}

const ExpandedDetail = memo(function ExpandedDetail({ log }: { log: ObservationLog }) {
  return (
    <div className="border-l-4 border-l-sla-primary-container space-y-3">
      <div className="font-mono text-[12px] text-sla-primary font-semibold">
        OBSERVATION DETAIL · row {log.row}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-sla-outline-variant/70 bg-white rounded-lg p-3 shadow-sm min-w-0">
          <div className="font-mono text-[11px] text-sla-on-surface uppercase font-semibold mb-2 border-b border-sla-outline-variant/50 pb-1.5">
            Source record
          </div>
          <dl className="font-mono text-[11px] text-sla-secondary space-y-1">
            {[
              ['Service', log.service || '—'],
              ['Agent', log.agentId],
              ['Region', log.region || '—'],
              ['Timestamp', log.timestamp],
              ['Latency', log.latencyMs === null ? '—' : `${log.latencyMs}ms`],
              ['Status', log.status],
              ['Dataset', log.datasetId],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-sla-text-muted">{k}</dt>
                <dd className="font-medium text-right break-all text-sla-on-surface">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="border border-sla-outline-variant/70 bg-white rounded-lg p-3 shadow-sm min-w-0">
          <div className="font-mono text-[11px] text-sla-on-surface uppercase font-semibold mb-2 border-b border-sla-outline-variant/50 pb-1.5">
            Raw payload
          </div>
          <pre className="font-mono text-[11px] text-sla-secondary overflow-x-auto whitespace-pre-wrap break-all bg-sla-surface p-2 rounded-lg border border-sla-outline-variant/50 thin-scroll">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
})

interface BreachTableProps {
  logs: ObservationLog[]
  pending: boolean
  error: string | null
  onRetry: () => void
  filtering: boolean
  pageStart: number
  total: number
  datasetName?: string | null
  windowLabel?: string | null
}

/**
 * Observation rows from the reporting API. Expanding a row shows its real
 * source record + raw payload — no fabricated incidents, services, or
 * stack traces.
 */
export const BreachTable = memo(function BreachTable({
  logs,
  pending,
  error,
  onRetry,
  filtering,
  pageStart,
  total,
  datasetName,
  windowLabel,
}: BreachTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const columns = useMemo<Array<DataTableColumn<ObservationLog>>>(
    () => [
      {
        key: 'row',
        header: '#',
        align: 'center',
        cellClassName: 'whitespace-nowrap text-sla-text-muted',
        render: (_log, index) => pageStart + index + 1,
      },
      {
        key: 'timestamp',
        header: 'Timestamp (UTC)',
        cellClassName: 'whitespace-nowrap text-sla-secondary',
        render: (log) => formatUtcDateTime(log.timestamp),
      },
      {
        key: 'service',
        header: 'Service',
        cellClassName: 'whitespace-nowrap font-semibold',
        render: (log) => log.service || '—',
      },
      {
        key: 'agent',
        header: 'Agent',
        cellClassName: 'whitespace-nowrap font-semibold',
        render: (log) => log.agentId,
      },
      {
        key: 'region',
        header: 'Region',
        cellClassName: 'whitespace-nowrap text-sla-secondary',
        render: (log) => log.region || '—',
      },
      {
        key: 'latency',
        header: 'Latency',
        align: 'right',
        cellClassName: 'whitespace-nowrap',
        render: (log) => (
          <span className={log.status === 'DOWN' ? 'font-bold text-sla-danger' : undefined}>
            {log.latencyMs === null ? '—' : `${log.latencyMs}ms`}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        cellClassName: 'whitespace-nowrap',
        render: (log) => <StatusBadge tone={statusTone(log.status)}>{log.status.toUpperCase()}</StatusBadge>,
      },
      {
        key: 'action',
        header: 'Detail',
        align: 'center',
        cellClassName: 'whitespace-nowrap',
        render: (log) => {
          const key = `${log.datasetId}:${log.row}`
          const isExpanded = expandedKey === key
          return (
            <button
              type="button"
              onClick={() => setExpandedKey((prev) => (prev === key ? null : key))}
              aria-expanded={isExpanded}
              className="rounded-lg border border-sla-outline-variant bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-sla-secondary shadow-sm transition-all duration-150 hover:text-sla-on-surface hover:border-sla-outline active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
            >
              {isExpanded ? 'Collapse [▲]' : 'Inspect [↵]'}
            </button>
          )
        },
      },
    ],
    [expandedKey, pageStart],
  )

  return (
    <DataTable<ObservationLog>
      title="Observations"
      badge={<StatusBadge tone="neutral">{formatCount(filtering ? logs.length : total)} rows</StatusBadge>}
      meta={
        <>
          <span className="font-semibold text-sla-on-surface">{datasetName ?? 'No dataset'}</span>
          {windowLabel ? <span> · {windowLabel}</span> : null}
          <span> · DOWN rows are breaches — expand any row for its source record.</span>
        </>
      }
      columns={columns}
      rows={logs}
      rowKey={(log) => `${log.datasetId}:${log.row}`}
      rowClassName={(log) => (log.status === 'DOWN' ? 'bg-rose-50/40 hover:bg-rose-50/70' : '')}
      expandedKey={expandedKey}
      renderExpanded={(log) => <ExpandedDetail log={log} />}
      pending={pending}
      error={
        error
          ? { title: 'Could not load breach logs.', message: error, onRetry }
          : null
      }
      emptyTitle={filtering ? 'No rows match the filter.' : 'No observations in range.'}
      emptyDescription={
        filtering
          ? 'Clear the search or status filters to see all loaded rows.'
          : 'Widen the dataset coverage or pick another dataset.'
      }
      className="flex-1"
    />
  )
})
