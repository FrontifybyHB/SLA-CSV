import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Icon } from '@/shared/ui/Icon'
import { StatusBadge, type StatusBadgeTone } from '@/shared/ui/StatusBadge'
import { getErrorMessage, getErrorRequestId } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { useDatasets, type DatasetSummary } from '@/features/datasets'

function statusOf(dataset: DatasetSummary): { label: string; tone: StatusBadgeTone } {
  if (dataset.issueCount > 0) return { label: 'HAS ISSUES', tone: 'warning' }
  return { label: 'INGESTED', tone: 'success' }
}

interface DatasetsTableProps {
  filter?: string
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export function DatasetsTable({ filter = '', selectedId = null, onSelect }: DatasetsTableProps) {
  const datasetsQuery = useDatasets()

  const all = useMemo(() => datasetsQuery.data ?? [], [datasetsQuery.data])
  const q = filter.trim().toLowerCase()
  const visible = useMemo(
    () => (q ? all.filter((d) => d.filename.toLowerCase().includes(q)) : all),
    [all, q],
  )

  const columns = useMemo<Array<DataTableColumn<DatasetSummary>>>(
    () => [
      {
        key: 'dataset',
        header: 'Dataset',
        cellClassName: 'min-w-[11rem]',
        render: (dataset) => {
          const hasIssues = dataset.issueCount > 0
          return (
            <span className="inline-flex items-center gap-2 font-medium text-sla-on-surface">
              <Icon
                name={hasIssues ? 'warning' : 'description'}
                size={17}
                className={hasIssues ? 'shrink-0 text-sla-warning' : 'shrink-0 text-sla-secondary'}
              />
              <span className="break-words">{dataset.filename}</span>
            </span>
          )
        },
      },
      {
        key: 'uploaded',
        header: 'Uploaded (UTC)',
        cellClassName: 'whitespace-nowrap text-sla-secondary',
        render: (dataset) => formatUtcDateTime(dataset.uploadedAt),
      },
      {
        key: 'rows',
        header: 'Rows',
        align: 'right',
        cellClassName: 'whitespace-nowrap font-semibold',
        render: (dataset) => formatCount(dataset.observationCount),
      },
      {
        key: 'policy',
        header: 'Policy',
        cellClassName: 'whitespace-nowrap font-mono text-[12px]',
        render: (dataset) => dataset.policyVersion || '—',
      },
      {
        key: 'overview',
        header: 'Overview',
        align: 'right',
        cellClassName: 'whitespace-nowrap',
        render: (dataset) => (
          <Link
            to={`/dashboard?dataset=${encodeURIComponent(dataset.datasetId)}`}
            className="font-semibold text-sla-primary hover:underline"
          >
            Open →
          </Link>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cellClassName: 'whitespace-nowrap',
        render: (dataset) => {
          const status = statusOf(dataset)
          return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        },
      },
      {
        key: 'action',
        header: 'Action',
        align: 'right',
        cellClassName: 'whitespace-nowrap',
        render: (dataset) => {
          const selected = dataset.datasetId === selectedId
          return (
            <button
              type="button"
              onClick={() => onSelect?.(dataset.datasetId)}
              aria-pressed={selected}
              className={[
                'rounded-lg border px-2.5 py-1 font-mono text-[12px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1',
                selected
                  ? 'border-sla-primary bg-sla-primary/10 font-semibold text-sla-primary'
                  : 'border-sla-outline-variant bg-white text-sla-secondary shadow-sm hover:text-sla-on-surface hover:border-sla-outline active:scale-[0.97]',
              ].join(' ')}
            >
              {selected ? 'Selected' : 'Select'}
            </button>
          )
        },
      },
    ],
    [selectedId, onSelect],
  )

  if (datasetsQuery.isError) {
    return (
      <DataTable<DatasetSummary>
        title="Datasets inventory"
        columns={columns}
        rows={[]}
        rowKey={(d) => d.datasetId}
        error={{
          title: 'Could not load dataset inventory.',
          message: getErrorMessage(datasetsQuery.error),
          requestId: getErrorRequestId(datasetsQuery.error),
          onRetry: () => void datasetsQuery.refetch(),
        }}
      />
    )
  }

  return (
    <DataTable<DatasetSummary>
      title="Datasets inventory"
      badge={<StatusBadge tone="neutral">{all.length} total</StatusBadge>}
      meta={
        q
          ? <>Filter {`"${filter.trim()}"`} — showing {visible.length} of {all.length}.</>
          : <>Upload a CSV above — imports are idempotent, re-uploads return the existing dataset.</>
      }
      columns={columns}
      rows={visible}
      rowKey={(d) => d.datasetId}
      rowClassName={(d) => (d.issueCount > 0 ? 'bg-rose-50/40 hover:bg-rose-50/70' : '')}
      pending={datasetsQuery.isPending}
      emptyTitle={all.length === 0 ? 'No datasets yet.' : 'No datasets match the filter.'}
      emptyDescription={
        all.length === 0
          ? 'Upload a CSV above to create the first inventory record.'
          : `Nothing matches "${filter.trim()}". Clear the search to see everything.`
      }
      footer={
        <>
          <span>
            Showing {visible.length} of {all.length} datasets
          </span>
          <span className="hidden sm:inline">CSV → slots → SLA</span>
        </>
      }
    />
  )
}
