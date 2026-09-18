import { Suspense, lazy, useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { DashboardTopNav } from './DashboardTopNav'
import { WorkspaceHeader } from './WorkspaceHeader'
import { IngestController } from './IngestController'
import { StreamInspector } from './StreamInspector'
import { SchemaAlert } from './SchemaAlert'
import { DatasetsTable } from './DatasetsTable'
import {
  ImportSummary,
  useDataset,
  useDatasets,
  type DatasetSummary,
  type UploadResult,
} from '@/features/datasets'
import { Card } from '@/shared/ui/Card'
import { Collapsible } from '@/shared/ui/Collapsible'
import { DashboardFooter } from '@/shared/ui/DashboardFooter'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { GraphBackground } from '@/shared/ui/GraphBackground'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Stat } from '@/shared/ui/Stat'
import { getErrorMessage, getErrorRequestId } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { useDebounce } from '@/shared/lib/useDebounce'
import { useDashboardLocation } from '../useDashboardLocation'

const DiagnosticPanel = lazy(() =>
  import('./DiagnosticPanel').then((m) => ({ default: m.DiagnosticPanel })),
)

function DatasetOverview({ query }: { query: UseQueryResult<DatasetSummary> }) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        requestId={getErrorRequestId(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const dataset = query.data

  if (!dataset) {
    return <EmptyState title="No dataset metadata." />
  }

  return (
    <>
      <p className="truncate text-[0.9375rem] font-semibold text-sla-on-surface">{dataset.filename}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Stat label="Rows imported" value={formatCount(dataset.observationCount)} />
        <Stat label="Slots" value={formatCount(dataset.slotCount)} />
        <Stat label="Issues" value={formatCount(dataset.issueCount)} />
        <Stat label="Agents" value={formatCount(dataset.agentCount)} />
        <Stat label="Policy version" value={dataset.policyVersion || '—'} />
        <Stat label="Uploaded" value={formatUtcDateTime(dataset.uploadedAt)} />
      </dl>
      <Collapsible title="Coverage (UTC)">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <Stat label="Start" value={formatUtcDateTime(dataset.startDate)} />
          <Stat label="End" value={formatUtcDateTime(dataset.endDate)} />
        </dl>
      </Collapsible>
    </>
  )
}

export function CsvIngestPage() {
  const { params, setParams } = useDashboardLocation()
  const [recentImports, setRecentImports] = useState<Array<{ result: UploadResult; filename: string }>>([])
  const [tableFilter, setTableFilter] = useState('')
  const debouncedFilter = useDebounce(tableFilter, 300)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [autoIndex, setAutoIndex] = useState(true)

  const datasetId = params.dataset
  const datasetQuery = useDataset(datasetId)
  const datasetsQuery = useDatasets()

  function handleDatasetChange(next: string) {
    setParams({ dataset: next || null, from: null, to: null, service: null, region: null })
  }

  function handleUploaded(result: UploadResult, file: File) {
    setRecentImports((prev) => [{ result, filename: file.name }, ...prev].slice(0, 3))
    if (autoIndex) {
      setParams({ dataset: result.datasetId, from: null, to: null, service: null, region: null })
    }
  }

  return (
    <div className="min-h-screen bg-sla-bg text-sla-on-surface font-sla antialiased flex flex-col pb-10">
      <a href="#ingest-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-sla-primary-container focus:text-sla-on-primary focus:rounded-sm focus:font-semibold focus:text-sm">
        Skip to content
      </a>

      <DashboardTopNav search={tableFilter} onSearchChange={setTableFilter} />

      <main id="ingest-main" className="relative flex-1 w-full animate-fade-up">
        <GraphBackground gridSize={22} backgroundColor="transparent" />
        <div className="relative w-full max-w-[80rem] mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <PageHeader
          eyebrow="Datasets"
          title="CSV ingest workspace"
          description="Upload a CSV extract once — imports are idempotent — then pick a dataset below to inspect its rows, slots and quality flags."
        />

        <WorkspaceHeader />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <IngestController
              onUploaded={handleUploaded}
              autoIndex={autoIndex}
              onAutoIndexChange={setAutoIndex}
            />
            <StreamInspector dataset={datasetQuery.data ?? null} />
            <SchemaAlert
              issueCount={datasetQuery.data?.issueCount ?? 0}
              datasetId={datasetId}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7 min-w-0">
            <DatasetsTable
              filter={debouncedFilter}
              selectedId={datasetId}
              onSelect={handleDatasetChange}
            />

            {recentImports.length > 0 ? (
              <div className="flex flex-col gap-3" aria-live="polite">
                {recentImports.map(({ result, filename }) => (
                  <ImportSummary
                    key={`${result.datasetId}-${filename}`}
                    result={result}
                    filename={filename}
                    onView={() => setParams({ dataset: result.datasetId })}
                    onDismiss={() =>
                      setRecentImports((prev) =>
                        prev.filter((i) => i.result.datasetId !== result.datasetId || i.filename !== filename),
                      )
                    }
                  />
                ))}
              </div>
            ) : null}

            {datasetId ? (
              <Card title="Dataset details">
                <DatasetOverview query={datasetQuery} />
              </Card>
            ) : (
              <Card>
                <EmptyState
                  title="No dataset selected."
                  description="Pick a row in the inventory above to load its metadata. Monitoring results will appear here."
                />
              </Card>
            )}
          </div>
        </div>
        </div>
      </main>

      <Suspense fallback={null}>
        {diagnosticsOpen ? (
          <DiagnosticPanel
            dataset={datasetQuery.data ?? null}
            onClose={() => setDiagnosticsOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setDiagnosticsOpen(true)}
            aria-label="Open diagnostics panel"
            title="Open diagnostics panel"
            className="inline-flex fixed right-4 bottom-12 z-40 items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-sla-outline-variant bg-white shadow-[0_1px_2px_rgb(16_24_40/0.12)] font-mono text-label-sm text-sla-secondary hover:text-sla-on-surface hover:border-sla-primary/40 transition-colors"
          >
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-sla-primary-container" />
            Diagnostics
          </button>
        )}
      </Suspense>
      <DashboardFooter
        left={
          <span>
            {datasetsQuery.data
              ? `${datasetsQuery.data.length} dataset${datasetsQuery.data.length === 1 ? '' : 's'}`
              : 'Syncing…'}
            {' · '}CSV → slots → SLA
          </span>
        }
        right={<span>Idempotent imports</span>}
      />
    </div>
  )
}