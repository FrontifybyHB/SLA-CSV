import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'
import { KVList } from '@/shared/ui/KVList'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import type { DatasetSummary } from '@/features/datasets'
import { useReportingIssues } from '@/features/reporting'

type PanelTab = 'dataset' | 'quality' | 'payload'

const TABS: Array<{ id: PanelTab; icon: string; label: string }> = [
  { id: 'dataset', icon: 'monitoring', label: 'Dataset' },
  { id: 'quality', icon: 'bug_report', label: 'Quality' },
  { id: 'payload', icon: 'data_object', label: 'Raw payload' },
]

interface DiagnosticPanelProps {
  dataset: DatasetSummary | null
  onClose: () => void
}

export function DiagnosticPanel({ dataset, onClose }: DiagnosticPanelProps) {
  const [tab, setTab] = useState<PanelTab>('dataset')
  const queryClient = useQueryClient()
  const issuesQuery = useReportingIssues(dataset?.datasetId ?? null, 1, 50)

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ['datasets'] })
    void queryClient.invalidateQueries({ queryKey: ['reporting'] })
  }

  return (
    <aside aria-label="Diagnostic panel" className="flex fixed top-12 right-0 bottom-8 z-40 flex-col justify-between w-[22rem] max-w-[92vw] border-l border-sla-outline-variant/60 bg-white shadow-[-8px_0_24px_rgb(16_24_40/0.10)]">
      <div className="overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-sla-outline-variant/60 bg-sla-surface">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0 font-mono text-label-md font-bold tracking-wider">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-sla-primary-container flex-shrink-0" />
              DIAGNOSTIC PANEL
            </div>
            <p className="text-label-sm font-mono text-sla-secondary overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
              {dataset ? dataset.filename : 'NO DATASET SELECTED'}
            </p>
          </div>
          <IconButton label="Close panel" onClick={onClose} className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface hover:text-sla-on-surface">
            <Icon name="close" size={16} />
          </IconButton>
        </div>

        <nav className="flex border-b border-sla-outline-variant/60 min-w-0" aria-label="Diagnostic sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`flex-1 flex items-center justify-center gap-1 p-2 border-b-2 transition-colors font-mono text-[11px] sm:text-label-md min-w-0 ${
                tab === t.id
                  ? 'border-sla-primary bg-sla-primary/6 text-sla-primary font-semibold'
                  : 'border-transparent text-sla-secondary hover:bg-sla-surface hover:text-sla-on-surface'
              }`}
            >
              <Icon name={t.icon} size={14} className="shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 flex flex-col gap-4">
          {!dataset ? (
            <p className="font-mono text-label-md text-sla-secondary">
              Select a dataset to inspect its import metadata and quality counters here.
            </p>
          ) : null}

          {dataset && tab === 'dataset' ? (
            <KVList
              items={[
                ['OBSERVATIONS', formatCount(dataset.observationCount)],
                ['RESOLVED SLOTS', formatCount(dataset.slotCount)],
                ['AGENTS', formatCount(dataset.agentCount)],
                ['POLICY', dataset.policyVersion || '—'],
                ['UPLOADED', formatUtcDateTime(dataset.uploadedAt)],
              ]}
            />
          ) : null}

          {dataset && tab === 'quality' ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sla-secondary">DATA QUALITY ISSUES</span>
                  <span className={`font-bold ${dataset.issueCount > 0 ? 'text-warning' : 'text-success'}`}>
                    {formatCount(dataset.issueCount)}
                  </span>
                </div>
                <p className="text-sla-secondary mt-2 leading-relaxed">
                  {dataset.issueCount > 0
                    ? 'Rows flagged during normalization (bad timestamps, unknown status, missing fields). The import itself succeeded; flagged rows were quarantined.'
                    : 'No rows were flagged during normalization. Every imported row parsed cleanly.'}
                </p>
                <p className="text-sla-secondary mt-2">
                  Coverage {formatUtcDateTime(dataset.startDate)} → {formatUtcDateTime(dataset.endDate)}
                </p>
              </div>
              {dataset.issueCount > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {issuesQuery.isPending ? (
                    <p className="font-mono text-label-md text-sla-secondary">Loading issue details…</p>
                  ) : issuesQuery.isError ? (
                    <div className="flex items-center justify-between gap-2 font-mono text-label-md">
                      <span className="text-danger">Could not load issue details.</span>
                      <button
                        type="button"
                        onClick={() => void issuesQuery.refetch()}
                        className="font-semibold text-sla-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (issuesQuery.data?.issues.length ?? 0) === 0 ? (
                    <p className="font-mono text-label-md text-sla-secondary">No issue rows returned.</p>
                  ) : (
                    <>
                      <ul className="flex flex-col gap-1.5 font-mono text-label-md max-h-72 overflow-y-auto">
                        {issuesQuery.data?.issues.map((issue) => (
                          <li
                            key={issue.id}
                            className="p-2 rounded-sm bg-amber-50/60 border border-amber-300/60 min-w-0"
                          >
                            <div className="flex justify-between gap-2">
                              <span className="font-semibold text-amber-800">Row {issue.rowNumber}</span>
                              <span className="text-sla-secondary truncate">{issue.field}</span>
                            </div>
                            <div className="text-sla-secondary mt-0.5 break-words">{issue.message}</div>
                          </li>
                        ))}
                      </ul>
                      {(issuesQuery.data?.total ?? 0) > (issuesQuery.data?.issues.length ?? 0) && (
                        <p className="font-mono text-label-sm text-sla-secondary">
                          Showing {issuesQuery.data?.issues.length} of {formatCount(issuesQuery.data?.total ?? 0)} issues.
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {dataset && tab === 'payload' ? (
            <pre className="p-3.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-sm overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(dataset, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>

      <div className="p-4 border-t border-sla-outline-variant/60 bg-sla-surface flex flex-col gap-3">
        <Button variant="secondary" size="sm" className="w-full" onClick={handleRefresh}>
          <Icon name="refresh" size={16} />
          Refresh dataset metadata
        </Button>
        <div className="flex items-center justify-around gap-3 pt-2 border-t border-sla-outline-variant font-mono text-label-md text-sla-secondary">
          {dataset ? (
            <Link
              to={`/dashboard?dataset=${encodeURIComponent(dataset.datasetId)}`}
              className="flex items-center gap-1.5 text-inherit hover:text-sla-on-surface whitespace-nowrap"
            >
              <Icon name="monitoring" size={16} />
              <span>Open SLA overview</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 whitespace-nowrap opacity-60">
              <Icon name="monitoring" size={16} />
              <span>Open SLA overview</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
