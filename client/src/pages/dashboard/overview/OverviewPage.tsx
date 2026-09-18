import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useDataset, useDatasets } from '@/features/datasets'
import {
  useReportingLogs,
  useReportingSlots,
  useReportingStats,
  type ObservationLog,
  type ReportingRange,
  type SlotRecord,
  type StatsSummary,
} from '@/features/reporting'
import { getErrorMessage } from '@/shared/api/api-error'
import { formatCount, formatUtcDateTime } from '@/shared/lib/format'
import { DashboardFooter } from '@/shared/ui/DashboardFooter'
import { DashboardHeader } from '@/shared/ui/DashboardHeader'
import { DataTable } from '@/shared/ui/DataTable'
import { DASHBOARD_NAV_LINKS, useSignOut } from '@/shared/ui/dashboard-nav'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { GraphBackground } from '@/shared/ui/GraphBackground'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'
import { KVList } from '@/shared/ui/KVList'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useDashboardLocation } from '../useDashboardLocation'

/** Reference availability target used for delta + error-budget math. */
const SLA_TARGET_PCT = 99.9
const MAX_RANGE_DAYS = 90
const LOG_PAGE_SIZE = 10

type RangePreset = '24h' | '7d' | '30d' | 'all'

const RANGE_PRESETS: Array<{ id: RangePreset; label: string }> = [
  { id: '24h', label: '24 Hours' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'Full coverage' },
]

function toIso(d: Date): string {
  return d.toISOString()
}

/**
 * Derives the reporting range from the dataset's real coverage window.
 * Falls back to the trailing 30 days when the dataset has no coverage
 * (e.g. an empty import), and clamps to the server's 90-day maximum.
 */
function resolveRange(
  startDate: string | null,
  endDate: string | null,
  preset: RangePreset,
): ReportingRange | null {
  let end = endDate ? Date.parse(endDate) : Number.NaN
  let start = startDate ? Date.parse(startDate) : Number.NaN
  if (!Number.isFinite(end)) end = Date.now()
  if (!Number.isFinite(start)) start = end - 30 * 24 * 60 * 60 * 1000

  const spanMs =
    preset === '24h'
      ? 24 * 60 * 60 * 1000
      : preset === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : preset === '30d'
          ? 30 * 24 * 60 * 60 * 1000
          : end - start

  let from = preset === 'all' ? start : end - spanMs
  if (from < start) from = start
  if (end - from > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    from = end - MAX_RANGE_DAYS * 24 * 60 * 60 * 1000
  }
  if (!(from <= end)) return null
  return { startDate: toIso(new Date(from)), endDate: toIso(new Date(end)) }
}

function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base])
}

function formatMs(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value.toFixed(value < 100 ? 1 : 0)}ms`
}

function formatUtcTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  const s = status.toUpperCase()
  if (s === 'UP') return 'success'
  if (s === 'DOWN') return 'danger'
  if (s === 'MIXED') return 'warning'
  return 'neutral'
}

function AvailabilityCard({ stats }: { stats: StatsSummary | undefined }) {
  if (!stats) {
    return (
      <MetricCard title="AVAILABILITY" hint="Share of resolved time that was UP. Higher is better.">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </MetricCard>
    )
  }
  const total = stats.uptimeSeconds + stats.downtimeSeconds
  const allowed = total * ((100 - SLA_TARGET_PCT) / 100)
  const remaining = allowed - stats.downtimeSeconds
  const remainingPct = allowed > 0 ? Math.max(0, (remaining / allowed) * 100) : 100
  const met = stats.availabilityPct >= SLA_TARGET_PCT
  const delta = stats.availabilityPct - SLA_TARGET_PCT

  return (
    <MetricCard
      title="AVAILABILITY"
      hint="Share of resolved time that was UP. Higher is better."
      badge={<StatusBadge tone={met ? 'success' : 'danger'}>{met ? 'Target met' : 'Below target'}</StatusBadge>}
      footer={
        <span>
          {formatCount(stats.counts.up)} up · {formatCount(stats.counts.down)} down ·{' '}
          {formatCount(stats.counts.unknown)} unknown · {formatCount(stats.counts.mixed)} mixed
        </span>
      }
    >
      <p className="font-mono text-2xl font-bold tracking-tight">
        {stats.availabilityPct.toFixed(3)}
        <span className="text-sm text-sla-secondary">%</span>
      </p>
      <p className="text-body-sm text-text-muted">
        Target <span className="font-mono font-semibold text-sla-on-surface">{SLA_TARGET_PCT.toFixed(1)}%</span>{' '}
        <span className={`font-mono font-semibold ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
          ({delta >= 0 ? '+' : ''}
          {delta.toFixed(3)}%)
        </span>
      </p>
      <div>
        <div className="flex justify-between font-mono text-label-md text-sla-secondary">
          <span>Error budget</span>
          <span>
            {Math.max(0, remaining).toFixed(0)}s of {allowed.toFixed(0)}s left
          </span>
        </div>
        <div
          className="h-2 mt-2 rounded-full bg-sla-surface border border-sla-outline-variant overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(100, Math.max(0, remainingPct)))}
          aria-label="Error budget remaining"
        >
          <div
            className={`h-full rounded-full ${remainingPct > 25 ? 'bg-sla-primary-container' : 'bg-danger'}`}
            style={{ width: `${Math.min(100, Math.max(0, remainingPct))}%` }}
          />
        </div>
      </div>
    </MetricCard>
  )
}

function IncidentsCard({
  breaches,
  downSlotCount,
  acknowledged,
  onAcknowledge,
  onDiagnose,
}: {
  breaches: ObservationLog[]
  downSlotCount: number
  acknowledged: Set<string>
  onAcknowledge: (key: string) => void
  onDiagnose: () => void
}) {
  const visible = breaches.filter((b) => !acknowledged.has(`${b.datasetId}:${b.row}`)).slice(0, 2)
  return (
    <MetricCard
      title="ACTIVE INCIDENTS"
      hint="Newest DOWN observations. Acknowledge hides them for this session."
      badge={
        <StatusBadge tone={downSlotCount > 0 ? 'danger' : 'success'}>
          {downSlotCount > 0 ? `${downSlotCount} failing slots` : 'All clear'}
        </StatusBadge>
      }
      footer={<span>Source: observation logs with status DOWN, newest first.</span>}
    >
      {visible.length === 0 ? (
        <EmptyState
          title="No unacknowledged breaches."
          description="No DOWN observations in this range, or all have been acknowledged."
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((b) => {
            const key = `${b.datasetId}:${b.row}`
            return (
              <li key={key} className="p-3 rounded-sm border border-danger bg-danger-soft/40 min-w-0">
                <div className="flex justify-between gap-2 font-mono text-label-md min-w-0">
                  <span className="font-semibold truncate min-w-0">
                    {b.agentId} · DOWN
                  </span>
                  <span className="text-danger whitespace-nowrap shrink-0">{formatUtcTime(b.timestamp)}</span>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 mt-1.5 text-label-md text-sla-secondary">
                  <span className="font-mono">
                    latency {b.latencyMs === null ? '—' : `${b.latencyMs}ms`}
                  </span>
                  <span className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onAcknowledge(key)}
                      className="font-semibold text-sla-secondary hover:text-sla-on-surface hover:underline"
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      onClick={onDiagnose}
                      className="font-semibold text-sla-primary hover:underline"
                    >
                      Inspect ↓
                    </button>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </MetricCard>
  )
}

function LatencyCard({ stats, slots }: { stats: StatsSummary | undefined; slots: SlotRecord[] }) {
  const latencies = useMemo(() => {
    const values = slots
      .map((s) => s.averageLatencyMs)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      .sort((a, b) => a - b)
    return {
      p50: quantile(values, 0.5),
      p95: quantile(values, 0.95),
      max: values.length > 0 ? values[values.length - 1] : null,
      n: values.length,
    }
  }, [slots])

  const rows: Array<[string, string]> = [
    ['Average (stats)', formatMs(stats?.averageLatencyMs)],
    ['p50 across slots', formatMs(latencies.p50)],
    ['p95 across slots', formatMs(latencies.p95)],
  ]

  return (
    <MetricCard
      title="LATENCY"
      hint="Response-time distribution across resolved slots."
      badge={<StatusBadge tone="neutral">Resolved slots</StatusBadge>}
      footer={
        <span>
          From {formatCount(latencies.n)} slots with latency · max {formatMs(latencies.max)}
        </span>
      }
    >
      <KVList items={rows} />
    </MetricCard>
  )
}

function TrendCard({ slots, range }: { slots: SlotRecord[]; range: ReportingRange }) {
  const points = useMemo(() => {
    const ordered = [...slots].sort(
      (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
    )
    return ordered.slice(0, 120)
  }, [slots])

  const W = 700
  const H = 200
  const PAD = 8
  const maxLatency = Math.max(1, ...points.map((p) => p.averageLatencyMs ?? 0))
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? W / 2 : PAD + (i / (points.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((p.averageLatencyMs ?? 0) / maxLatency) * (H - PAD * 2 - 20)
    return { x, y, slot: p }
  })
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const avg = points.length
    ? points.reduce((sum, p) => sum + (p.averageLatencyMs ?? 0), 0) / points.length
    : 0
  const avgY = H - PAD - (avg / maxLatency) * (H - PAD * 2 - 20)

  return (
    <MetricCard
      title="LATENCY TREND"
      hint="Average latency per slot, oldest → newest. Red dots are failing slots."
      badge={
        <span className="font-mono text-label-sm text-sla-secondary">{formatCount(points.length)} slots</span>
      }
      footer={
        <span className="flex flex-wrap justify-between gap-x-3 gap-y-1">
          <span className="min-w-0">{formatUtcTime(range.startDate)}</span>
          <span className="min-w-0 text-right">{formatUtcTime(range.endDate)} UTC</span>
        </span>
      }
    >
      {points.length === 0 ? (
        <EmptyState title="No slots in range." description="Slots resolved from observations will be plotted here." />
      ) : (
        <div className="relative w-full h-56 border border-sla-outline-variant rounded-sm bg-sla-surface/50 overflow-hidden">
          <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
            <line x1="0" x2={W} y1={avgY} y2={avgY} stroke="#94a3b8" strokeDasharray="5,4" strokeWidth="1.5" />
            {coords.length > 1 ? (
              <polyline points={line} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}
            {coords.map((c) =>
              c.slot.status === 'down' || c.slot.status === 'mixed' ? (
                <circle key={c.slot.slotKey} cx={c.x} cy={c.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              ) : (
                <circle key={c.slot.slotKey} cx={c.x} cy={c.y} r="2.5" fill="#2563eb" />
              ),
            )}
          </svg>
          <div className="absolute left-2 top-2 bg-white border border-sla-outline-variant rounded-sm px-2 py-1 font-mono text-label-sm">
            avg <span className="font-bold">{formatMs(avg)}</span> · max{' '}
            <span className="font-bold">{formatMs(maxLatency)}</span>
          </div>
        </div>
      )}
    </MetricCard>
  )
}

type DrawerTab = 'telemetry' | 'trace' | 'rca' | 'raw'

function DiagnosticsDrawer({
  open,
  onClose,
  stats,
  recentLogs,
  failingSlots,
  datasetJson,
  onInvalidate,
  invalidating,
}: {
  open: boolean
  onClose: () => void
  stats: StatsSummary | undefined
  recentLogs: ObservationLog[]
  failingSlots: SlotRecord[]
  datasetJson: string
  onInvalidate: () => void
  invalidating: boolean
}) {
  const [tab, setTab] = useState<DrawerTab>('telemetry')

  if (!open) return null

  const tabs: Array<{ id: DrawerTab; label: string; icon: string }> = [
    { id: 'telemetry', label: 'Telemetry', icon: 'monitoring' },
    { id: 'trace', label: 'Trace', icon: 'terminal' },
    { id: 'rca', label: 'Root cause', icon: 'bug_report' },
    { id: 'raw', label: 'Raw payload', icon: 'data_object' },
  ]

  return (
    <aside
      aria-label="Diagnostics panel"
      className="fixed right-0 top-12 bottom-8 w-[22rem] max-w-[90vw] flex flex-col border-l border-sla-outline-variant/60 bg-white z-40 shadow-[-8px_0_24px_rgb(16_24_40/0.08)]"
    >
      <div className="flex items-center justify-between gap-2 p-4 border-b border-sla-outline-variant/60">
        <div className="min-w-0">
          <p className="font-mono text-label-md font-bold tracking-wider">DIAGNOSTICS</p>
          <p className="font-mono text-label-sm text-sla-secondary truncate">
            {stats ? `${formatCount(stats.totalSlots)} slots · ${stats.availabilityPct.toFixed(2)}% avail` : 'No stats yet'}
          </p>
        </div>
        <IconButton label="Close diagnostics panel" onClick={onClose}>
          <Icon name="close" size={16} />
        </IconButton>
      </div>

      <div role="tablist" aria-label="Diagnostic views" className="flex border-b border-sla-outline-variant/60 min-w-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 font-mono text-[11px] transition-colors min-w-0 ${
              tab === t.id
                ? 'text-sla-primary font-semibold border-b-2 border-sla-primary bg-sla-primary/5'
                : 'text-sla-secondary hover:text-sla-on-surface'
            }`}
          >
            <Icon name={t.icon} size={13} className="shrink-0" />
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'telemetry' ? (
          stats ? (
            <KVList
              items={[
                ['Total slots', formatCount(stats.totalSlots)],
                ['Availability', `${stats.availabilityPct.toFixed(3)}%`],
                ['Uptime', `${formatCount(stats.uptimeSeconds)}s`],
                ['Downtime', `${formatCount(stats.downtimeSeconds)}s`],
                ['Unknown', `${formatCount(stats.unknownSeconds)}s`],
                ['Avg latency', formatMs(stats.averageLatencyMs)],
                ['Up / Down', `${stats.counts.up} / ${stats.counts.down}`],
                ['Unknown / Mixed', `${stats.counts.unknown} / ${stats.counts.mixed}`],
              ]}
            />
          ) : (
            <EmptyState title="No telemetry yet." description="Select a dataset to load stats." />
          )
        ) : null}

        {tab === 'trace' ? (
          recentLogs.length === 0 ? (
            <EmptyState title="No trace rows." description="Observation logs will stream here." />
          ) : (
            <ul className="flex flex-col gap-1.5 font-mono text-label-md">
              {recentLogs.slice(0, 12).map((l) => (
                <li key={`${l.datasetId}:${l.row}`} className="flex justify-between gap-2 p-2 rounded-sm bg-sla-surface border border-sla-outline-variant/60 min-w-0">
                  <span className="truncate min-w-0">
                    {l.agentId} · <span className={l.status === 'DOWN' ? 'text-danger font-semibold' : ''}>{l.status}</span>
                  </span>
                  <span className="text-sla-secondary whitespace-nowrap shrink-0">{formatUtcTime(l.timestamp)}</span>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === 'rca' ? (
          failingSlots.length === 0 ? (
            <EmptyState title="No failing slots." description="No down or mixed slots in this range." />
          ) : (
            <ul className="flex flex-col gap-1.5 font-mono text-label-md">
              {failingSlots.slice(0, 12).map((s) => (
                <li key={s.slotKey} className="p-2 rounded-sm bg-danger-soft/50 border border-danger/40">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-danger">{s.status.toUpperCase()}</span>
                    <span className="text-sla-secondary">{formatUtcTime(s.startTime)}</span>
                  </div>
                  <div className="text-sla-secondary mt-0.5">
                    down {s.downtimeSeconds}s · up {s.uptimeSeconds}s · avg {formatMs(s.averageLatencyMs)}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === 'raw' ? (
          <pre className="font-mono text-label-sm p-3 rounded-sm bg-sla-surface border border-sla-outline-variant/60 overflow-x-auto whitespace-pre-wrap break-all">
            {datasetJson}
          </pre>
        ) : null}
      </div>

      <div className="p-4 border-t border-sla-outline-variant/60 bg-sla-surface">
        <button
          type="button"
          onClick={onInvalidate}
          disabled={invalidating}
          className="w-full py-2 rounded-sm border border-sla-outline-variant bg-white font-mono text-label-md font-semibold hover:bg-sla-bg disabled:opacity-55"
        >
          {invalidating ? 'Refreshing…' : 'Invalidate telemetry cache'}
        </button>
      </div>
    </aside>
  )
}

export function OverviewPage() {
  const { params, setParams } = useDashboardLocation()
  const queryClient = useQueryClient()
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [preset, setPreset] = useState<RangePreset>('all')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())
  const [logPage, setLogPage] = useState(1)
  const { signOut, signingOut } = useSignOut()
  const logsRef = useRef<HTMLDivElement | null>(null)

  const datasetsQuery = useDatasets()
  const datasets = useMemo(() => datasetsQuery.data ?? [], [datasetsQuery.data])

  // Default to the first dataset when none is selected yet.
  const datasetId = params.dataset ?? datasets[0]?.datasetId ?? null
  const datasetQuery = useDataset(datasetId)
  const dataset = datasetQuery.data ?? null

  const range = useMemo(
    () => (dataset ? resolveRange(dataset.startDate, dataset.endDate, preset) : null),
    [dataset, preset],
  )

  const statsQuery = useReportingStats(datasetId, range)
  const logsQuery = useReportingLogs(datasetId, range, logPage, LOG_PAGE_SIZE)
  const slotsQuery = useReportingSlots(datasetId, range, 1, 100)

  const stats = statsQuery.data
  const logs = useMemo(() => logsQuery.data?.observations ?? [], [logsQuery.data])
  const logTotal = logsQuery.data?.total ?? 0
  const logPages = Math.max(1, Math.ceil(logTotal / LOG_PAGE_SIZE))
  const slots = useMemo(() => slotsQuery.data?.slots ?? [], [slotsQuery.data])

  const breaches = useMemo(() => logs.filter((l) => l.status === 'DOWN'), [logs])
  const failingSlots = useMemo(
    () => slots.filter((s) => s.status === 'down' || s.status === 'mixed'),
    [slots],
  )
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return logs
    return logs.filter(
      (l) =>
        l.agentId.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.datasetId.toLowerCase().includes(q) ||
        (l.service ?? '').toLowerCase().includes(q) ||
        (l.region ?? '').toLowerCase().includes(q),
    )
  }, [logs, search])

  const lastUpdated = useMemo(() => {
    const times = [statsQuery.dataUpdatedAt, logsQuery.dataUpdatedAt, slotsQuery.dataUpdatedAt].filter(Boolean)
    return times.length > 0 ? new Date(Math.max(...times)) : null
  }, [statsQuery.dataUpdatedAt, logsQuery.dataUpdatedAt, slotsQuery.dataUpdatedAt])

  const anyError = statsQuery.isError || logsQuery.isError || slotsQuery.isError
  const firstError = statsQuery.error ?? logsQuery.error ?? slotsQuery.error
  const syncing = statsQuery.isPending || logsQuery.isPending || slotsQuery.isPending

  useEffect(() => {
    setLogPage(1)
    setAcknowledged(new Set())
  }, [datasetId, preset, range?.startDate, range?.endDate])

  useEffect(() => {
    if (searchRef.current) {
      // Shared header owns the visible search box; keep ⌘K working here too
      // for keyboards when the header input is not rendered (mobile).
      const onKey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault()
          document.querySelector<HTMLInputElement>('header input[aria-label="Filter breach logs"]')?.focus()
        }
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [])

  function handleDatasetChange(next: string) {
    setParams({ dataset: next || null })
  }

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ['reporting'] })
    void datasetsQuery.refetch()
    if (datasetId) void datasetQuery.refetch()
  }

  async function handleSignOut() {
    await signOut()
  }

  function handleDiagnose() {
    logsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-sla-bg text-sla-on-surface font-sla antialiased flex flex-col pb-10">
      <DashboardHeader
        eyebrow={dataset ? dataset.filename : 'no dataset'}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Filter breach logs… (⌘K)',
          ariaLabel: 'Filter breach logs',
        }}
        links={DASHBOARD_NAV_LINKS}
        status={
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm font-mono text-[11px] font-semibold whitespace-nowrap ${
              anyError
                ? 'border-danger bg-danger-soft text-danger'
                : syncing
                  ? 'border-warning bg-warning-soft text-warning'
                  : 'border-success bg-success-soft text-success'
            }`}
            role="status"
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full ${anyError ? 'bg-danger' : syncing ? 'bg-warning animate-pulse' : 'bg-success animate-pulse'}`}
            />
            {anyError ? 'ERROR' : syncing ? 'SYNCING' : lastUpdated ? `UPDATED ${lastUpdated.toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC` : 'LIVE'}
          </span>
        }
        actions={
          <>
            <IconButton
              label="Refresh telemetry"
              onClick={handleRefresh}
              className="p-1.5 rounded-sm text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface"
            >
              <Icon name="refresh" size={18} />
            </IconButton>
            <IconButton
              label={drawerOpen ? 'Hide diagnostics panel' : 'Show diagnostics panel'}
              onClick={() => setDrawerOpen((v) => !v)}
              className="p-1.5 rounded-sm text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface"
            >
              <Icon name="tune" size={18} />
            </IconButton>
          </>
        }
        userLabel="OP"
        onSignOut={() => void handleSignOut()}
        signingOut={signingOut}
      />

      <main className="relative flex-1 w-full animate-fade-up">
        <GraphBackground gridSize={22} backgroundColor="transparent" />
        <div className="relative w-full max-w-[80rem] mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <PageHeader
          eyebrow="Overview"
          title="Production dashboard"
          description="Live SLA telemetry for the selected dataset: pick an imported CSV, then read its availability, incidents and latency from the reporting API."
        />

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-4 p-2.5 border border-sla-outline-variant/60 rounded-md bg-white shadow-[0_1px_2px_rgb(16_24_40/0.05)]">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Time range">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`px-2.5 py-1 rounded-sm font-mono text-label-sm transition-colors ${
                  preset === p.id
                    ? 'bg-sla-primary-container text-white font-semibold'
                    : 'text-sla-secondary hover:bg-sla-surface border border-sla-outline-variant'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="flex flex-wrap items-center gap-2 font-mono text-label-sm text-sla-secondary min-w-0">
            Dataset:
            {datasetsQuery.isPending ? (
              <Skeleton className="h-8 w-48" />
            ) : datasetsQuery.isError ? (
              <button type="button" onClick={() => void datasetsQuery.refetch()} className="text-danger hover:underline">
                Failed to load — retry
              </button>
            ) : datasets.length === 0 ? (
              <span>
                none yet — <Link to="/dashboard/dataset" className="text-sla-primary hover:underline">upload a CSV</Link>
              </span>
            ) : (
              <select
                value={datasetId ?? ''}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="w-full min-w-0 sm:w-auto sm:max-w-[16rem] px-2 py-1.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-md cursor-pointer text-sla-on-surface"
              >
                {datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.filename}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        {!datasetId ? (
          <MetricCard title="GETTING STARTED" hint="Upload first, measure second.">
            <EmptyState
              title="No dataset selected."
              description="Upload a CSV in the Datasets workspace, then come back here for live SLA telemetry."
            />
            <Link to="/dashboard/dataset" className="text-sla-primary font-semibold hover:underline">
              Go to Datasets →
            </Link>
          </MetricCard>
        ) : (
          <div className="flex flex-col gap-4">
            {datasetQuery.isError ? (
              <ErrorState
                title="Could not load dataset."
                message={getErrorMessage(datasetQuery.error)}
                onRetry={() => void datasetQuery.refetch()}
                retryLabel="Retry"
              />
            ) : null}
            {anyError && range ? (
              <ErrorState
                title="Telemetry queries failed."
                message={getErrorMessage(firstError)}
                onRetry={handleRefresh}
                retryLabel="Retry telemetry"
              />
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {statsQuery.isPending ? (
                <MetricCard title="AVAILABILITY" hint="Share of resolved time that was UP. Higher is better.">
                  <Skeleton className="h-9 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </MetricCard>
              ) : (
                <AvailabilityCard stats={stats} />
              )}
              <IncidentsCard
                breaches={breaches}
                downSlotCount={failingSlots.length}
                acknowledged={acknowledged}
                onAcknowledge={(key) => setAcknowledged((prev) => new Set(prev).add(key))}
                onDiagnose={handleDiagnose}
              />
              {slotsQuery.isPending ? (
                <MetricCard title="LATENCY" hint="Response-time distribution across resolved slots.">
                  <Skeleton className="h-9 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </MetricCard>
              ) : (
                <LatencyCard stats={stats} slots={slots} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-8">
                {slotsQuery.isPending || !range ? (
                  <MetricCard title="LATENCY TREND" hint="Average latency per slot, oldest → newest.">
                    <Skeleton className="h-56 w-full" />
                  </MetricCard>
                ) : (
                  <TrendCard slots={slots} range={range} />
                )}
              </div>
              <div className="lg:col-span-4">
                <MetricCard
                  title="DATASET QUALITY"
                  hint="What the importer saw: rows in, slots out, rows flagged."
                  badge={
                    <StatusBadge tone={(dataset?.issueCount ?? 0) > 0 ? 'warning' : 'success'}>
                      {(dataset?.issueCount ?? 0) > 0 ? `${dataset?.issueCount} issues` : 'Clean'}
                    </StatusBadge>
                  }
                  footer={
                    <span>
                      Coverage {formatUtcTime(dataset?.startDate)} → {formatUtcTime(dataset?.endDate)} UTC
                    </span>
                  }
                >
                  <ul className="flex flex-col gap-2 text-body-sm">
                    <li className="flex items-start gap-2 text-success">
                      <Icon name="check_circle" size={15} />
                      <span>
                        {formatCount(dataset?.observationCount)} rows parsed from {dataset?.filename}
                      </span>
                    </li>
                    {(dataset?.issueCount ?? 0) > 0 ? (
                      <li className="flex items-start gap-2 text-warning">
                        <Icon name="warning" size={15} />
                        <span>
                          {formatCount(dataset?.issueCount)} row{(dataset?.issueCount ?? 0) === 1 ? '' : 's'} flagged
                          during normalization and quarantined
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-success">
                        <Icon name="check_circle" size={15} />
                        <span>No rows flagged during normalization</span>
                      </li>
                    )}
                  </ul>
                  <KVList
                    items={[
                      ['Resolved slots', formatCount(dataset?.slotCount)],
                      ['Agents', formatCount(dataset?.agentCount)],
                      ['Policy', dataset?.policyVersion || '—'],
                    ]}
                  />
                </MetricCard>
              </div>
            </div>

            <div ref={logsRef} id="breach-logs" className="scroll-mt-20">
              <DataTable<ObservationLog>
                title="Breach logs"
                badge={
                  <StatusBadge tone="neutral">
                    {formatCount(logTotal)} rows · page {logPage} of {logPages}
                  </StatusBadge>
                }
                meta="Every observation in range, newest first. DOWN rows are breaches."
                columns={[
                  {
                    key: 'time',
                    header: 'Time (UTC)',
                    cellClassName: 'whitespace-nowrap text-sla-secondary',
                    render: (l) => formatUtcDateTime(l.timestamp),
                  },
                  {
                    key: 'service',
                    header: 'Service',
                    cellClassName: 'whitespace-nowrap font-semibold',
                    render: (l) => l.service || '—',
                  },
                  {
                    key: 'agent',
                    header: 'Agent',
                    cellClassName: 'whitespace-nowrap font-semibold',
                    render: (l) => l.agentId,
                  },
                  {
                    key: 'region',
                    header: 'Region',
                    cellClassName: 'whitespace-nowrap text-sla-secondary',
                    render: (l) => l.region || '—',
                  },
                  {
                    key: 'latency',
                    header: 'Latency',
                    align: 'right',
                    cellClassName: 'whitespace-nowrap',
                    render: (l) => (l.latencyMs === null ? '—' : `${l.latencyMs}ms`),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    cellClassName: 'whitespace-nowrap',
                    render: (l) => (
                      <StatusBadge tone={statusTone(l.status)}>{l.status.toUpperCase()}</StatusBadge>
                    ),
                  },
                ]}
                rows={filteredLogs}
                rowKey={(l) => `${l.datasetId}:${l.row}`}
                rowClassName={(l) => (l.status === 'DOWN' ? 'bg-rose-50/40 hover:bg-rose-50/70' : '')}
                pending={logsQuery.isPending}
                error={
                  logsQuery.isError
                    ? {
                        title: 'Could not load logs.',
                        message: getErrorMessage(logsQuery.error),
                        onRetry: () => void logsQuery.refetch(),
                      }
                    : null
                }
                emptyTitle={logs.length === 0 ? 'No observations in range.' : 'No rows match the filter.'}
                emptyDescription={
                  logs.length === 0
                    ? 'Widen the time range or pick another dataset.'
                    : 'Clear the search box to see all loaded rows.'
                }
                footer={
                  <>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={logPage <= 1}
                        onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-sla-outline-variant bg-white px-2.5 py-1 font-mono text-[12px] disabled:opacity-40 hover:border-sla-outline active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
                      >
                        ← Prev
                      </button>
                      <span>
                        Page {logPage} of {logPages}
                      </span>
                      <button
                        type="button"
                        disabled={logPage >= logPages}
                        onClick={() => setLogPage((p) => Math.min(logPages, p + 1))}
                        className="rounded-lg border border-sla-outline-variant bg-white px-2.5 py-1 font-mono text-[12px] disabled:opacity-40 hover:border-sla-outline active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-1"
                      >
                        Next →
                      </button>
                    </span>
                    <Link
                      to={`/dashboard/breaches${params.dataset ? `?dataset=${encodeURIComponent(params.dataset)}` : ''}`}
                      className="font-semibold text-sla-primary hover:underline"
                    >
                      Open full breach logs →
                    </Link>
                  </>
                }
              />
            </div>
          </div>
        )}
        </div>
      </main>

      <DiagnosticsDrawer
        open={drawerOpen && datasetId !== null}
        onClose={() => setDrawerOpen(false)}
        stats={stats}
        recentLogs={logs}
        failingSlots={failingSlots}
        datasetJson={dataset ? JSON.stringify(dataset, null, 2) : '{}'}
        onInvalidate={handleRefresh}
        invalidating={syncing}
      />

      <DashboardFooter
        left={
          <span>
            {dataset ? dataset.filename : 'SLA Monitor'} ·{' '}
            {stats ? `${stats.availabilityPct.toFixed(3)}% availability · ${formatCount(stats.totalSlots)} slots` : 'awaiting telemetry'}
          </span>
        }
        right={
          <span>Range {range ? `${formatUtcTime(range.startDate)} → ${formatUtcTime(range.endDate)} UTC` : '—'}</span>
        }
      />
    </div>
  )
}
