import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusBadge, type StatusBadgeTone } from '@/shared/ui/StatusBadge'
import { getErrorMessage, getErrorRequestId } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { useDatasets, type DatasetSummary } from '@/features/datasets'

function statusOf(dataset: DatasetSummary): { label: string; tone: StatusBadgeTone } {
  if (dataset.issueCount > 0) return { label: 'HAS_ISSUES', tone: 'warning' }
  return { label: 'INGESTED', tone: 'success' }
}

function DatasetRows({ datasets }: { datasets: DatasetSummary[] }) {
  return (
    <>
      {datasets.map((dataset) => {
        const status = statusOf(dataset)
        const hasIssues = dataset.issueCount > 0
        return (
          <tr key={dataset.datasetId} className={hasIssues ? 'bg-rose-50/50' : undefined}>
            <td>
              <span className="inline-flex items-center gap-2.5 font-medium text-sla-on-surface">
                <Icon name={hasIssues ? 'warning' : 'description'} size={17} className="app-icon" />
                {dataset.filename}
              </span>
            </td>
            <td>{formatUtcDateTime(dataset.uploadedAt)}</td>
            <td className="text-right font-semibold text-sla-on-surface">{formatCount(dataset.observationCount)}</td>
            <td>{dataset.policyVersion || '—'}</td>
            <td className="text-right" title="Per-dataset SLA aggregates arrive with the stats panel">—</td>
            <td><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td>
            <td>
              <IconButton label={`More options for ${dataset.filename}`} className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
                <Icon name="more_vert" size={16} />
              </IconButton>
            </td>
          </tr>
        )
      })}
    </>
  )
}

export function DatasetsTable() {
  const datasetsQuery = useDatasets()

  let body: React.ReactNode
  if (datasetsQuery.isPending) {
    body = (
      <tr>
        <td colSpan={7}>
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </td>
      </tr>
    )
  } else if (datasetsQuery.isError) {
    body = (
      <tr>
        <td colSpan={7}>
          <ErrorState
            title="Could not load dataset inventory."
            message={getErrorMessage(datasetsQuery.error)}
            requestId={getErrorRequestId(datasetsQuery.error)}
            onRetry={() => void datasetsQuery.refetch()}
            retryLabel="Retry"
          />
        </td>
      </tr>
    )
  } else if ((datasetsQuery.data ?? []).length === 0) {
    body = (
      <tr>
        <td colSpan={7}>
          <EmptyState
            title="No datasets yet."
            description="Upload a CSV above to create the first inventory record."
          />
        </td>
      </tr>
    )
  } else {
    body = <DatasetRows datasets={datasetsQuery.data ?? []} />
  }

  const count = datasetsQuery.data?.length ?? 0

  return (
    <Card flush>
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-sla-outline-variant/50 bg-white">
        <span className="flex items-center gap-2 min-w-0 font-mono text-label-md font-bold tracking-wider">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-sla-primary-container flex-shrink-0" />
          HISTORICAL DATASETS INVENTORY
          <StatusBadge tone="neutral">{count} Artifacts</StatusBadge>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="text-label-sm font-mono text-sla-outline">PAGE: 1/1</span>
          <IconButton label="Filter dataset rows" className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
            <Icon name="filter_list" size={16} />
          </IconButton>
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sla-outline-variant/60 scrollbar-thumb-rounded-full">
        <table className="w-full min-w-[52rem] border-collapse text-left font-mono text-label-md">
          <thead>
            <tr className="border-b border-sla-outline-variant bg-sla-surface text-label-sm uppercase tracking-wider text-sla-secondary">
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Dataset Name</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Upload [UTC]</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">Total Rows</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Schema</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-right">SLA Met</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Opt</th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-t border-sla-outline-variant bg-sla-surface font-mono text-label-sm text-sla-secondary">
        <span>SHOWING {count} OF {count} RECORDS</span>
      </div>
    </Card>
  )
}