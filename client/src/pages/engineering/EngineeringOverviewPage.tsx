import React, { memo, useEffect, useState } from 'react'
import { TopNav } from '@/shared/ui/TopNav'
import { AppFooter } from '@/shared/ui/AppFooter'
import { Icon } from '@/shared/ui/Icon'
import { GraphBackground } from './GraphBackground'

/* ==========================================================================
 * Page-local nav / footer links (in-page anchors + app routes).
 * ========================================================================== */

const ENGINEERING_NAV_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Datasets', href: '#datasets' },
  { label: 'Breach logs', href: '#breach-logs' },
] as const

const ENGINEERING_FOOTER_LINKS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Home', href: '/' },
] as const

/* ==========================================================================
 * Static content
 * ========================================================================== */

const PIPELINE_STAGES: ReadonlyArray<{
  step: string
  tag: string
  title: string
  desc: string
  metaKey: string
  metaValue: string
  metaValueClass: string
  variant: 'default' | 'highlight' | 'alert'
  connectorLabel?: string
  connectorTone?: 'rose'
}> = [
  {
    step: '01 INGEST',
    tag: 'SIMD_SPLIT',
    title: 'CSV Chunking',
    desc: 'Multi-part chunk splitter & bounded ring buffer.',
    metaKey: 'Rate',
    metaValue: '100 MB/s',
    metaValueClass: 'text-emerald-status',
    variant: 'default' as const,
    connectorLabel: 'mmap',
  },
  {
    step: '02 COERCE',
    tag: 'TYPE_SAFE',
    title: 'Zero-Copy Schema',
    desc: 'Validation, memory pointers & numeric coercion.',
    metaKey: 'Latency',
    metaValue: '< 180μs',
    metaValueClass: 'text-accent',
    variant: 'default' as const,
    connectorLabel: 'IPC',
  },
  {
    step: '03 MATRIX',
    tag: 'P99.9',
    title: 'SLA Matrix Engine',
    desc: 'Distributed sliding window quantile aggregator.',
    metaKey: 'Drift',
    metaValue: '0.000% False+',
    metaValueClass: 'text-emerald-status',
    variant: 'highlight' as const,
    connectorLabel: 'Fork',
  },
  {
    step: '04 SINK',
    tag: 'STORAGE',
    title: 'Parquet / Columnar',
    desc: 'Immutable append-only ClickHouse partition sink.',
    metaKey: 'Commit',
    metaValue: 'Synced',
    metaValueClass: 'text-accent',
    variant: 'default' as const,
    connectorLabel: 'Breach',
    connectorTone: 'rose' as const,
  },
  {
    step: '05 DISPATCH',
    tag: 'ALERT',
    title: 'PagerDuty Alert',
    desc: 'Deterministic webhooks, Opsgenie, & OTEL metrics.',
    metaKey: 'Trigger',
    metaValue: '< 12ms dispatch',
    metaValueClass: 'text-rose-600',
    variant: 'alert' as const,
  },
]

type SlaRow = {
  metric: string
  target: string
  p95: string
  p99: string
  p99Class: string
  drift: string
  driftClass: string
  status: 'MET' | 'BREACH'
  rowClass: string
  showDot?: boolean
}

const SLA_TARGET_ROWS: readonly SlaRow[] = [
  { metric: 'pipeline.ingest.csv.p99_latency', target: '< 50.00ms', p95: '18.42ms', p99: '41.88ms', p99Class: 'text-emerald-600 font-medium', drift: '-8.12ms', driftClass: 'text-text-muted', status: 'MET', rowClass: '' },
  { metric: 'schema.coerce.type_safety_ratio', target: '100.000%', p95: '100.000%', p99: '100.000%', p99Class: 'text-emerald-600 font-medium', drift: '0.000%', driftClass: 'text-text-muted', status: 'MET', rowClass: '' },
  { metric: 'sink.clickhouse.batch_flush_p999', target: '< 150.00ms', p95: '112.40ms', p99: '189.62ms', p99Class: 'text-rose-600 font-semibold', drift: '+39.62ms', driftClass: 'text-rose-600 font-semibold', status: 'BREACH', rowClass: 'bg-rose-50/20 hover:bg-rose-50/50', showDot: true },
  { metric: 'stream.backpressure.buffer_headroom', target: '> 40.00%', p95: '68.10%', p99: '54.30%', p99Class: 'text-text-primary', drift: '+14.30%', driftClass: 'text-text-muted', status: 'MET', rowClass: '' },
]

const BENCHMARKS = [
  { label: 'Sustained Throughput', value: '1.2M', valueClass: 'text-text-primary', note: 'rows / sec per ingestion core' },
  { label: 'P99 Ingestion Latency', value: '42ms', valueClass: 'text-emerald-600', note: 'end-to-end wire to partition commit' },
  { label: 'SLA Enforcement Bound', value: '99.999%', valueClass: 'text-accent', note: 'quantile measurement accuracy' },
  { label: 'False-Positive Ratio', value: '0.000%', valueClass: 'text-text-primary', note: 'zero heuristic drift or false breach alerts' },
] as const

const INGEST_PARAMS = [
  { key: 'Evaluation Metric:', value: 'P99_ROUNDTRIP_MS', valueClass: 'text-accent font-mono font-medium text-[11px] break-all' },
  { key: 'Breach Threshold:', value: '120.000 ms', valueClass: 'text-text-primary font-mono font-medium text-[11px] whitespace-nowrap' },
  { key: 'Memory Allocation:', value: 'Strict Zero-Copy', valueClass: 'text-emerald-status font-mono font-medium text-[11px] whitespace-nowrap' },
] as const

/* ==========================================================================
 * Shared class tokens
 * ========================================================================== */

const CARD_SHELL =
  'border border-border-subtle rounded-xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md'

const PANEL_HEADER =
  'flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3 mb-4'

/* ==========================================================================
 * Live UTC clock (real time, not a hardcoded string).
 * ========================================================================== */

function useUtcClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })
}

/* ==========================================================================
 * StatusStrip (editorial sub-header)
 * ========================================================================== */

const StatusStrip = memo(function StatusStrip({ nowUtc }: { nowUtc: string }) {
  return (
    <section className="border-b border-border-subtle bg-white px-3 sm:px-4 lg:px-6 py-2">
      <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 text-xs text-text-secondary">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-text-primary font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">
            v2.4-STABLE
          </span>
          <span aria-hidden="true" className="text-text-muted hidden sm:inline">•</span>
          <span className="font-mono text-xs whitespace-nowrap">Pipeline: Synchronized</span>
          <span aria-hidden="true" className="text-text-muted hidden sm:inline">•</span>
          <span className="text-emerald-status flex items-center gap-1.5 font-medium whitespace-nowrap">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-status" />
            Ingest Engine Nominal
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted font-mono text-[11px]">
          <span className="whitespace-nowrap">SYS_KERN: 6.8.0</span>
          <span className="hidden md:inline whitespace-nowrap">ALLOC: 4.1MB DIRECT</span>
          <span className="whitespace-nowrap">UTC {nowUtc}</span>
        </div>
      </div>
    </section>
  )
})

/* ==========================================================================
 * Masthead
 * ========================================================================== */

const Masthead = memo(function Masthead() {
  return (
    <section id="overview" className="border-b border-border-subtle pb-6 lg:pb-8 scroll-mt-20 animate-fade-up">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3 text-xs text-text-muted font-mono">
        <span className="text-accent font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded whitespace-nowrap">
          RFC-9110
        </span>
        <span aria-hidden="true" className="hidden sm:inline">•</span>
        <span className="text-slate-600 font-medium">DETERMINISTIC BOUNDARY COMPLIANCE</span>
        <span aria-hidden="true" className="hidden sm:inline">•</span>
        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-medium whitespace-nowrap">
          ACTIVE ENFORCEMENT
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary max-w-4xl mb-4 leading-tight">
        Deterministic SLA observability for high-throughput telemetry streams.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-sm sm:text-base text-text-secondary max-w-3xl leading-relaxed">
            Engineered for platform and SRE teams requiring absolute mathematical certainty.
            SLA_MONITOR executes sub-millisecond zero-copy chunk parsing, synchronous quantile
            evaluation, and deterministic alerting across multi-gigabyte continuous telemetry
            streams with zero synthetic drift.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row items-stretch lg:justify-end gap-3">
          <a
            href="/dashboard"
            className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-5 py-2.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap hover:shadow-md hover:-translate-y-px active:translate-y-0"
          >
            <span>Open Dashboard</span>
            <span aria-hidden="true" className="text-[10px] text-blue-200 font-mono">↵</span>
          </a>
          <a
            href="/#api"
            className="bg-white hover:bg-surface-subtle text-text-primary text-xs font-semibold px-4 py-2.5 rounded-md border border-border-subtle shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap hover:shadow-md hover:-translate-y-px active:translate-y-0"
          >
            <span>CLI Schema</span>
            <Icon name="terminal" size={15} className="text-text-secondary" />
          </a>
        </div>
      </div>
    </section>
  )
})

/* ==========================================================================
 * PipelineDiagram (blueprint canvas via the shared GraphBackground)
 * ========================================================================== */

type Stage = (typeof PIPELINE_STAGES)[number]

const StageCard = memo(function StageCard({ stage }: { stage: Stage }) {
  if (stage.variant === 'highlight') {
    return (
      <div className="w-full lg:w-60 bg-white border-2 border-accent rounded-lg p-4 shadow-sm relative">
        <div className="absolute -top-2.5 right-3 bg-accent text-white text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide whitespace-nowrap">
          EVALUATOR
        </div>
        <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-2.5 gap-2">
          <span className="text-accent text-[11px] font-bold font-mono">{stage.step}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium whitespace-nowrap">
            {stage.tag}
          </span>
        </div>
        <div className="text-sm font-bold text-text-primary mb-1">{stage.title}</div>
        <p className="text-xs text-text-secondary mb-3 leading-relaxed">{stage.desc}</p>
        <div className="pt-2 border-t border-border-muted text-[11px] flex items-center justify-between gap-2">
          <span className="text-text-muted">{stage.metaKey}</span>
          <span className={`${stage.metaValueClass} font-mono font-medium whitespace-nowrap`}>
            {stage.metaValue}
          </span>
        </div>
      </div>
    )
  }

  if (stage.variant === 'alert') {
    return (
      <div className="w-full lg:w-56 bg-white border border-rose-200 rounded-lg p-4 shadow-sm hover:border-rose-300 transition-colors">
        <div className="flex items-center justify-between border-b border-rose-100 pb-2 mb-2.5 gap-2">
          <span className="text-rose-600 text-[11px] font-semibold font-mono">{stage.step}</span>
          <span className="text-[10px] text-rose-500 font-mono whitespace-nowrap">{stage.tag}</span>
        </div>
        <div className="text-sm font-semibold text-text-primary mb-1">{stage.title}</div>
        <p className="text-xs text-text-secondary mb-3 leading-relaxed">{stage.desc}</p>
        <div className="pt-2 border-t border-rose-100 text-[11px] flex items-center justify-between gap-2">
          <span className="text-text-muted">{stage.metaKey}</span>
          <span className={`${stage.metaValueClass} font-mono font-medium whitespace-nowrap`}>
            {stage.metaValue}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-56 bg-white border border-border-subtle rounded-lg p-4 shadow-sm hover:border-accent/40 transition-colors">
      <div className="flex items-center justify-between border-b border-border-muted pb-2 mb-2.5 gap-2">
        <span className="text-accent text-[11px] font-semibold font-mono">{stage.step}</span>
        <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">{stage.tag}</span>
      </div>
      <div className="text-sm font-semibold text-text-primary mb-1">{stage.title}</div>
      <p className="text-xs text-text-secondary mb-3 leading-relaxed">{stage.desc}</p>
      <div className="pt-2 border-t border-border-muted text-[11px] flex items-center justify-between gap-2">
        <span className="text-text-muted">{stage.metaKey}</span>
        <span className={`${stage.metaValueClass} font-mono font-medium whitespace-nowrap`}>
          {stage.metaValue}
        </span>
      </div>
    </div>
  )
})

const StageConnector = memo(function StageConnector({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'rose'
}) {
  const arrowClass = tone === 'rose' ? 'text-rose-500' : 'text-slate-400'
  const labelClass = tone === 'rose' ? 'text-rose-600' : 'text-slate-400'

  return (
    <div className="flex lg:flex-col items-center justify-center text-text-muted text-xs py-0 lg:py-1 shrink-0">
      <span aria-hidden="true" className={`hidden lg:inline ${arrowClass}`}>→</span>
      <span aria-hidden="true" className={`lg:hidden ${arrowClass}`}>↓</span>
      <span className={`text-[10px] font-mono mt-0 lg:mt-0.5 ${labelClass}`}>{label}</span>
    </div>
  )
})

const PipelineDiagram = memo(function PipelineDiagram() {
  return (
    <section id="pipeline" className={`${CARD_SHELL} overflow-hidden scroll-mt-20`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 sm:px-5 py-3 bg-white">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span aria-hidden="true" className="w-2 h-2 rounded-sm bg-accent shrink-0" />
          <span className="font-semibold text-text-primary tracking-wide">ARCHITECTURE PIPELINE</span>
          <span aria-hidden="true" className="text-border-subtle hidden sm:inline">|</span>
          <span className="text-text-muted font-mono text-[11px]">Zero-Copy Streaming Flow</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-text-muted font-mono text-[11px] hidden sm:inline">Buffer: Ring/SIMD</span>
          <span className="border border-emerald-200 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-[11px] font-medium whitespace-nowrap">
            STABLE FLOW
          </span>
        </div>
      </div>

      <div className="relative p-4 sm:p-6 lg:p-10">
        <GraphBackground
          position="absolute"
          gridSize={24}
          majorEvery={5}
          backgroundColor="#FFFFFF"
          fineLineColor="rgba(241, 245, 249, 1)"
          majorLineColor="rgba(203, 213, 225, 0.5)"
          tickColor="rgba(148, 163, 184, 0.45)"
          zIndex={0}
        />
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between w-full max-w-6xl mx-auto gap-2 lg:gap-0">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.step}>
              <StageCard stage={stage} />
              {i < PIPELINE_STAGES.length - 1 && (
                <StageConnector
                  label={stage.connectorLabel ?? '→'}
                  tone={stage.connectorTone ?? 'default'}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="border-t border-border-subtle px-3 sm:px-5 py-2.5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted font-mono">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="whitespace-nowrap">Resolution: Stream Native</span>
          <span aria-hidden="true" className="text-border-subtle hidden sm:inline">•</span>
          <span className="whitespace-nowrap">Zero V8 Heap Overrun</span>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-status shrink-0" />
          <span className="text-slate-600">32-Core Parallel Evaluation Active</span>
        </div>
      </div>
    </section>
  )
})

/* ==========================================================================
 * IngestionCard — links to the real upload workspace.
 * ========================================================================== */

const IngestionCard = memo(function IngestionCard() {
  return (
    <div className="lg:col-span-4 bg-white border border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-shadow duration-200 hover:shadow-md">
      <div>
        <div className={PANEL_HEADER}>
          <div className="text-xs font-semibold text-text-primary tracking-wide uppercase">
            Telemetry Ingestion
          </div>
          <span className="text-[11px] font-mono text-text-muted whitespace-nowrap">FD: STDIN</span>
        </div>

        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          Verify telemetry schema against active SLA constraints. Accepts RFC-4180 CSV, gzipped
          streams, and Arrow IPC batches.
        </p>

        <a
          href="/dashboard/dataset"
          aria-label="Open the CSV ingest workspace to upload telemetry"
          className="block w-full border border-dashed border-slate-300 hover:border-accent bg-slate-50/70 hover:bg-blue-50/30 rounded-lg p-5 sm:p-6 text-center transition-all cursor-pointer group mb-5 hover:shadow-sm"
        >
          <div className="flex justify-center mb-2">
            <Icon name="upload" size={30} className="text-slate-400 group-hover:text-accent transition-colors" />
          </div>
          <div className="text-xs font-semibold text-text-primary mb-1">
            Drag telemetry CSV or click to stream
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Auto-chunk: 64MB • UTF-8 / ASCII
          </div>
        </a>

        <div className="space-y-2 text-xs border border-border-subtle rounded-lg p-3 bg-slate-50/50">
          {INGEST_PARAMS.map((row, i) => (
            <div
              key={row.key}
              className={`flex flex-wrap items-center justify-between gap-2 py-1 ${
                i < INGEST_PARAMS.length - 1 ? 'border-b border-border-subtle/60' : ''
              }`}
            >
              <span className="text-text-secondary">{row.key}</span>
              <span className={row.valueClass}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border-subtle mt-4">
        <a
          href="/dashboard/dataset"
          className="block w-full text-center bg-white hover:bg-surface-subtle text-text-primary border border-border-subtle py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow"
        >
          Open ingest workspace
        </a>
      </div>
    </div>
  )
})

/* ==========================================================================
 * SlaMatrixTable — links to the live breach logs.
 * ========================================================================== */

const SlaMatrixTable = memo(function SlaMatrixTable() {
  return (
    <div id="breach-logs" className="lg:col-span-8 bg-white border border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between scroll-mt-20 transition-shadow duration-200 hover:shadow-md">
      <div>
        <div className={PANEL_HEADER}>
          <div className="text-xs font-semibold text-text-primary tracking-wide uppercase">
            Active SLA Target Matrix
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <span className="whitespace-nowrap">Regions: 8</span>
            <span aria-hidden="true" className="hidden sm:inline">•</span>
            <span className="text-emerald-700 font-medium whitespace-nowrap">Synchronous Mode</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 thin-scroll">
          <table className="w-full min-w-[44rem] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-mono">
                <th scope="col" className="py-2.5 px-4 sm:px-0 sm:pr-4 font-semibold whitespace-nowrap">Metric Key</th>
                <th scope="col" className="py-2.5 px-3 font-semibold whitespace-nowrap">SLA Target</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">P95</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">P99</th>
                <th scope="col" className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Drift (Δ)</th>
                <th scope="col" className="py-2.5 px-4 sm:pl-4 sm:pr-0 font-semibold text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/80 font-mono text-[12px]">
              {SLA_TARGET_ROWS.map((row) => {
                const breach = row.status === 'BREACH'
                return (
                  <tr
                    key={row.metric}
                    className={`${row.rowClass || 'hover:bg-slate-50/70'} transition-colors`}
                  >
                    <td className="py-3 px-4 sm:px-0 sm:pr-4 text-text-primary font-medium">
                      {row.showDot ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-rose-status shrink-0" />
                          <span className="break-all">{row.metric}</span>
                        </span>
                      ) : (
                        <span className="break-all">{row.metric}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap">{row.target}</td>
                    <td className="py-3 px-3 text-right text-text-primary whitespace-nowrap">{row.p95}</td>
                    <td className={`py-3 px-3 text-right whitespace-nowrap ${row.p99Class}`}>{row.p99}</td>
                    <td className={`py-3 px-3 text-right whitespace-nowrap ${row.driftClass}`}>{row.drift}</td>
                    <td className="py-3 px-4 sm:pl-4 sm:pr-0 text-right whitespace-nowrap">
                      <span
                        className={
                          breach
                            ? 'border border-rose-200 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-semibold font-sans'
                            : 'border border-emerald-200 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold font-sans'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 text-xs text-text-muted">
        <div className="flex flex-wrap items-center gap-2">
          <Icon name="check_circle" size={16} className="text-emerald-status" />
          <span className="text-text-primary font-medium whitespace-nowrap">3 targets compliant</span>
          <span aria-hidden="true" className="text-border-subtle">•</span>
          <span className="text-rose-600 font-medium whitespace-nowrap">1 active breach notified</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <a
            href="/dashboard/breaches"
            className="text-accent hover:text-accent-hover hover:underline font-sans font-medium whitespace-nowrap"
          >
            View live breach logs →
          </a>
        </div>
      </div>
    </div>
  )
})

/* ==========================================================================
 * BenchmarksSection
 * ========================================================================== */

const BenchmarksSection = memo(function BenchmarksSection() {
  return (
    <section className={`${CARD_SHELL} p-4 sm:p-6`}>
      <div className={PANEL_HEADER}>
        <div className="text-xs font-semibold text-text-primary tracking-wide uppercase">
          Benchmark Verification Suite
        </div>
        <div className="text-[11px] text-text-muted font-mono">
          AMD EPYC 7763 • 64-CORE • CARGO_CRITERION
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4">
        {BENCHMARKS.map((b, i) => (
          <div
            key={b.label}
            className={`pt-0 md:px-4 border-border-subtle ${
              i > 0 ? 'md:border-l' : 'md:first:pl-0 md:first:border-l-0'
            }`}
          >
            <div className="text-xs text-text-muted mb-1 font-medium">{b.label}</div>
            <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight mb-1 ${b.valueClass}`}>
              {b.value}
            </div>
            <div className="text-xs text-text-secondary leading-snug">{b.note}</div>
          </div>
        ))}
      </div>
    </section>
  )
})

/* ==========================================================================
 * Page — shared TopNav + AppFooter shell, page-specific sections.
 * ========================================================================== */

export function EngineeringOverviewPage() {
  const nowUtc = useUtcClock()

  return (
    <div className="bg-canvas text-text-primary antialiased min-h-screen font-body flex flex-col">
      <a
        href="#eo-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:font-semibold focus:text-sm"
      >
        Skip to content
      </a>

      <TopNav
        links={ENGINEERING_NAV_LINKS}
        activeFallback="#overview"
        containerClassName="home-container"
        brandHref="/"
        menuId="engineering-mobile-menu"
        actions={
          <>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-subtle bg-white text-text-secondary shadow-sm font-mono text-[11px] whitespace-nowrap">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-emerald-status animate-pulse" />
              <span className="text-emerald-600 font-medium">Nominal</span>
              <span aria-hidden="true" className="text-text-muted">·</span>
              <span className="text-text-muted">UTC {nowUtc}</span>
            </span>
            <a
              className="hidden sm:inline-flex items-center px-3 py-2 text-label-md text-sla-secondary rounded-sm hover:text-sla-on-surface hover:bg-sla-surface-container-low transition-colors whitespace-nowrap no-underline"
              href="/login"
            >
              Sign in
            </a>
            <a
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sla-primary-container text-white text-label-md font-medium rounded-sm transition-all shadow-sm hover:bg-sla-primary hover:shadow whitespace-nowrap no-underline"
              href="/dashboard"
            >
              <span>Open Dashboard</span>
              <Icon name="arrow_forward" size={15} />
            </a>
          </>
        }
        mobileExtra={
          <a href="/dashboard" className="py-2.5 text-label-md font-mono text-sla-secondary border-b border-sla-outline-variant/30 hover:text-sla-on-surface transition-colors">
            Open Dashboard
          </a>
        }
      />

      <main id="eo-main" className="pt-0 flex-1 flex flex-col">
        <StatusStrip nowUtc={nowUtc} />

        <div className="max-w-[1500px] mx-auto w-full px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-10 flex-1 flex flex-col gap-6 lg:gap-8">
          <Masthead />
          <PipelineDiagram />

          <section id="datasets" className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 scroll-mt-20">
            <IngestionCard />
            <SlaMatrixTable />
          </section>

          <BenchmarksSection />
        </div>
      </main>

      <AppFooter links={ENGINEERING_FOOTER_LINKS} tagline="Deterministic SLA observability for telemetry streams." />
    </div>
  )
}

export default EngineeringOverviewPage
