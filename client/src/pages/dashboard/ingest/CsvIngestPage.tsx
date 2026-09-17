import { Suspense, lazy, useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { DashboardTopNav } from './DashboardTopNav'
import { WorkspaceHeader } from './WorkspaceHeader'
import { IngestController } from './IngestController'
import { StreamInspector } from './StreamInspector'
import { SchemaAlert } from './SchemaAlert'
import { DatasetsTable } from './DatasetsTable'
import { StatusBar } from './StatusBar'
import {
  DatasetSelect,
  ImportSummary,
  useDataset,
  type DatasetSummary,
  type UploadResult,
} from '@/features/datasets'
import { Card } from '@/shared/ui/Card'
import { Collapsible } from '@/shared/ui/Collapsible'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { getErrorMessage, getErrorRequestId } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { useDashboardLocation } from '../useDashboardLocation'

const DiagnosticPanel = lazy(() =>
  import('./DiagnosticPanel').then((m) => ({ default: m.DiagnosticPanel })),
)
const EmptyStatePreview = lazy(() =>
  import('./EmptyStatePreview').then((m) => ({ default: m.EmptyStatePreview })),
)

function PanelFallback() {
  return (
    <Card>
      <Skeleton className="h-4 w-3/4" />
      <span style={{ display: 'block', height: 8 }} />
      <Skeleton className="h-4 w-3/4" />
    </Card>
  )
}

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
      <p className="text-lg font-semibold text-sla-on-surface">{dataset.filename}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <dt className="text-label-sm text-sla-text-muted">Rows imported</dt>
          <dd className="text-lg font-semibold mt-1">{formatCount(dataset.observationCount)}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-sla-text-muted">Slots</dt>
          <dd className="text-lg font-semibold mt-1">{formatCount(dataset.slotCount)}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-sla-text-muted">Issues</dt>
          <dd className="text-lg font-semibold mt-1">{formatCount(dataset.issueCount)}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-sla-text-muted">Agents</dt>
          <dd className="text-lg font-semibold mt-1">{formatCount(dataset.agentCount)}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-sla-text-muted">Policy version</dt>
          <dd className="text-lg font-semibold mt-1">{dataset.policyVersion || '—'}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-sla-text-muted">Uploaded</dt>
          <dd className="text-lg font-semibold mt-1">{formatUtcDateTime(dataset.uploadedAt)}</dd>
        </div>
      </dl>
      <Collapsible title="Coverage (UTC)">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-label-sm text-sla-text-muted">Start</dt>
            <dd className="text-lg font-semibold mt-1">{formatUtcDateTime(dataset.startDate)}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-sla-text-muted">End</dt>
            <dd className="text-lg font-semibold mt-1">{formatUtcDateTime(dataset.endDate)}</dd>
          </div>
        </dl>
      </Collapsible>
    </>
  )
}

export function CsvIngestPage() {
  const { params, setParams } = useDashboardLocation()
  const [lastImport, setLastImport] = useState<UploadResult | null>(null)

  const datasetId = params.dataset
  const datasetQuery = useDataset(datasetId)

  function handleDatasetChange(next: string) {
    setParams({ dataset: next || null, from: null, to: null, service: null, region: null })
  }

  function handleUploaded(result: UploadResult) {
    setLastImport(result)
    setParams({ dataset: result.datasetId, from: null, to: null, service: null, region: null })
  }

  return (
    <div className="min-h-screen bg-sla-bg text-sla-on-surface font-sla antialiased flex flex-col pb-7">
      <a href="#ingest-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-sla-primary-container focus:text-sla-on-primary focus:rounded-sm focus:font-semibold focus:text-sm">
        Skip to content
      </a>

      <DashboardTopNav />

      <main id="ingest-main" className="flex-1 w-full max-w-[1600px] mx-auto px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6 bg-[var(--ingest-grid-pattern)] bg-[size:24px_24px]">
        <div className="mb-4">
          <h1 className="text-headline-md font-semibold tracking-[-0.015em]">SLA Dashboard</h1>
          <p className="text-body-md text-sla-secondary mt-1">
            Import CSV extracts and inspect service-level availability.
          </p>
        </div>

        <WorkspaceHeader />

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-5">
            <IngestController onUploaded={handleUploaded} />
            <StreamInspector />
            <SchemaAlert />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-7">
            <DatasetsTable />

            {lastImport ? (
              <ImportSummary
                result={lastImport}
                onView={() => setParams({ dataset: lastImport.datasetId })}
                onDismiss={() => setLastImport(null)}
              />
            ) : null}

            <Card title="Select a dataset">
              <DatasetSelect
                value={datasetId}
                onChange={handleDatasetChange}
                hint="Chosen here in the address bar and shared when copied."
              />
            </Card>

            {datasetId ? (
              <Card title="Dataset details">
                <DatasetOverview query={datasetQuery} />
              </Card>
            ) : (
              <Card>
                <EmptyState
                  title="No dataset selected."
                  description="Pick a dataset above to load its metadata. Monitoring results will appear here."
                />
              </Card>
            )}

            <Suspense fallback={<PanelFallback />}>
              <EmptyStatePreview />
            </Suspense>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        <DiagnosticPanel />
      </Suspense>
      <StatusBar />
    </div>
  )
}