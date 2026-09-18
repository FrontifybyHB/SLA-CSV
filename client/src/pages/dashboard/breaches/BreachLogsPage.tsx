import { useCallback, useEffect, useMemo, useState } from 'react'
import { DatasetSelect, useDataset, useDatasets } from '@/features/datasets'
import { useReportingLogs, type ObservationLog } from '@/features/reporting'
import { getErrorMessage } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { DashboardHeader } from '@/shared/ui/DashboardHeader'
import { DashboardFooter } from '@/shared/ui/DashboardFooter'
import { DASHBOARD_NAV_LINKS, useSignOut } from '@/shared/ui/dashboard-nav'
import { GraphBackground } from '@/shared/ui/GraphBackground'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useDashboardLocation } from '../useDashboardLocation'
import { BreachPagination } from './components/BreachPagination'
import { BreachTable } from './components/BreachTable'
import { BreachToolbar, type StatusFilter } from './components/BreachToolbar'
import { downloadCsv, observationsToCsv } from './lib/breach-csv'
import { resolveFullRange } from './lib/breach-range'

const PAGE_SIZE = 15

function matchesQuery(log: ObservationLog, q: string): boolean {
  if (!q) return true
  return (
    log.agentId.toLowerCase().includes(q) ||
    log.status.toLowerCase().includes(q) ||
    log.datasetId.toLowerCase().includes(q) ||
    (log.service ?? '').toLowerCase().includes(q) ||
    (log.region ?? '').toLowerCase().includes(q)
  )
}

export function BreachLogsPage() {
  const { params, setParams } = useDashboardLocation()

  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [activeStatuses, setActiveStatuses] = useState<StatusFilter[]>([])
  const { signOut, signingOut } = useSignOut()

  const datasetsQuery = useDatasets()
  const datasets = useMemo(() => datasetsQuery.data ?? [], [datasetsQuery.data])
  const datasetId = params.dataset ?? datasets[0]?.datasetId ?? null
  const datasetQuery = useDataset(datasetId)
  const dataset = datasetQuery.data ?? null

  const range = useMemo(
    () => (dataset ? resolveFullRange(dataset.startDate, dataset.endDate) : null),
    [dataset],
  )

  const logsQuery = useReportingLogs(datasetId, range, page, PAGE_SIZE)
  const logs = useMemo(() => logsQuery.data?.observations ?? [], [logsQuery.data])
  const total = logsQuery.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter(
      (l) => matchesQuery(l, q) && (activeStatuses.length === 0 || activeStatuses.includes(l.status as StatusFilter)),
    )
  }, [logs, query, activeStatuses])

  const syncing = logsQuery.isPending || datasetsQuery.isPending
  const anyError = logsQuery.isError

  useEffect(() => {
    setPage(1)
  }, [datasetId, range?.startDate, range?.endDate])

  const toggleStatus = useCallback((status: StatusFilter) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }, [])

  const clearFilters = useCallback(() => {
    setQuery('')
    setActiveStatuses([])
  }, [])

  const handleExport = useCallback(() => {
    if (filtered.length === 0) return
    const name = `breach-logs-${dataset?.filename ?? datasetId ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(name, observationsToCsv(filtered))
  }, [filtered, dataset, datasetId])

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-sla-bg text-sla-on-surface font-sla antialiased flex flex-col pb-10">
      <a
        href="#breaches-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:font-semibold focus:text-sm"
      >
        Skip to content
      </a>

      <DashboardHeader
        eyebrow={dataset ? dataset.filename : 'no dataset'}
        links={DASHBOARD_NAV_LINKS}
        status={
          <span
            role="status"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm font-mono text-[11px] font-semibold whitespace-nowrap ${
              anyError
                ? 'border-danger bg-danger-soft text-danger'
                : syncing
                  ? 'border-warning bg-warning-soft text-warning'
                  : 'border-success bg-success-soft text-success'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full ${anyError ? 'bg-danger' : syncing ? 'bg-warning animate-pulse' : 'bg-success animate-pulse'}`}
            />
            {anyError ? 'ERROR' : syncing ? 'SYNCING' : `${formatCount(total)} rows`}
          </span>
        }
        userLabel="OP"
        onSignOut={() => void handleSignOut()}
        signingOut={signingOut}
      />

      <main id="breaches-main" className="relative flex-1 flex flex-col w-full min-w-0 animate-fade-up">
        <GraphBackground gridSize={22} backgroundColor="transparent" />
        <div className="relative flex-1 flex flex-col w-full max-w-[80rem] mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 min-w-0">
        <PageHeader
          eyebrow="Breach logs"
          title="Breach logs"
          description="Every observation in range, newest first. DOWN rows are breaches — expand any row for its source record."
        />
        <div className="mb-4 w-full max-w-72">
          <DatasetSelect
            value={datasetId}
            onChange={(next) => setParams({ dataset: next || null })}
            hint="Shared in the address bar when copied."
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden bg-white border border-sla-outline-variant/70 rounded-xl shadow-[0_1px_2px_rgb(16_24_40/0.05)]">
            <BreachToolbar
              query={query}
              onQueryChange={setQuery}
              activeStatuses={activeStatuses}
              onToggleStatus={toggleStatus}
              onClearFilters={clearFilters}
              onExport={handleExport}
              exportDisabled={filtered.length === 0}
              resultCount={filtered.length}
              totalCount={logs.length}
            />
          </div>
          <BreachTable
            logs={filtered}
            pending={logsQuery.isPending}
            error={logsQuery.isError ? getErrorMessage(logsQuery.error) : null}
            onRetry={() => void logsQuery.refetch()}
            filtering={filtered.length !== logs.length}
            pageStart={(page - 1) * PAGE_SIZE}
            total={total}
            datasetName={dataset?.filename}
            windowLabel={
              range ? `${formatUtcDateTime(range.startDate)} → ${formatUtcDateTime(range.endDate)}` : null
            }
          />
          <div className="bg-white border border-sla-outline-variant/70 rounded-xl shadow-[0_1px_2px_rgb(16_24_40/0.05)] px-4 py-3 sm:px-5">
            <BreachPagination
              total={total}
              page={page}
              pages={pages}
              pageSize={PAGE_SIZE}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />
          </div>
        </div>
        </div>
      </main>

      <DashboardFooter
        left={
          <span>
            {dataset ? dataset.filename : 'SLA Monitor'} · {formatCount(total)} rows
          </span>
        }
        right={<span>Breach logs</span>}
      />
    </div>
  )
}
