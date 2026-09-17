import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'

const DIAGNOSTIC_TABS = [
  { icon: 'monitoring', label: 'Telemetry Matrix', pill: 'ACTIVE', pillClass: 'bg-blue-100 text-blue-700 font-bold', active: true },
  { icon: 'terminal', label: 'Live Trace Stream', pill: '240 TPS', pillClass: 'text-sla-outline', active: false },
  { icon: 'bug_report', label: 'Root Cause Analysis', pill: '1 ALERT', pillClass: 'border border-rose-300 bg-rose-50 text-rose-700 font-semibold', active: false },
  { icon: 'data_object', label: 'Raw Ingest Payload', pill: 'RFC-4180', pillClass: 'text-sla-outline', active: false },
] as const

const HISTOGRAM_BARS = [
  { height: '30%', color: '#93c5fd' },
  { height: '55%', color: '#60a5fa' },
  { height: '85%', color: '#3b82f6' },
  { height: '100%', color: '#2563eb' },
  { height: '40%', color: '#60a5fa' },
  { height: '20%', color: '#fb7185' },
] as const

export function DiagnosticPanel() {
  return (
    <aside aria-label="Diagnostic panel" className="hidden xl:flex fixed top-[3.25rem] right-0 bottom-7 z-40 flex-col justify-between w-[24rem] border-l border-sla-outline-variant/60 bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
      <div className="overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-sla-outline-variant/60 bg-sla-surface">
          <div>
            <div className="flex items-center gap-2 min-w-0 font-mono text-label-md font-bold tracking-wider">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-sla-primary-container flex-shrink-0" />
              DIAGNOSTIC PANEL
            </div>
            <p className="text-label-sm font-mono text-sla-secondary overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">TRACE ID: 9e2a-7bf1-4091</p>
          </div>
          <IconButton label="Close panel" className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface hover:text-sla-on-surface">
            <Icon name="close" size={16} />
          </IconButton>
        </div>

        <nav className="flex flex-col border-b border-sla-outline-variant/60" aria-label="Diagnostic sections">
          {DIAGNOSTIC_TABS.map((tab) => (
            <a
              key={tab.label}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`flex items-center justify-between gap-2 p-3 border-l-2 transition-colors ${
                tab.active
                  ? 'border-sla-primary bg-sla-primary/6 text-sla-primary font-semibold'
                  : 'border-transparent text-sla-secondary hover:bg-sla-surface hover:text-sla-on-surface'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                <Icon name={tab.icon} size={17} />
                {tab.label}
              </span>
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-sm font-mono text-label-sm ${tab.pillClass}`}>{tab.pill}</span>
            </a>
          ))}
        </nav>

        <div className="p-4 flex flex-col gap-4">
          <div className="p-3.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-md">
            <div className="text-label-sm font-semibold uppercase tracking-wider text-sla-outline mb-2">Parser State</div>
            <div className="flex items-center justify-between gap-2 text-sla-secondary">
              <span>HEAP_ALLOCATION</span>
              <span className="text-sla-primary font-bold">1,024 MB</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sla-secondary mt-1.5">
              <span>ZERO_COPY_PIPELINE</span>
              <span className="text-sla-tertiary-container font-bold">ENABLED</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sla-secondary mt-1.5">
              <span>ERROR_TOLERANCE</span>
              <span className="text-rose-600 font-bold">FAIL_STRICT</span>
            </div>
          </div>

          <div className="p-3.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-md">
            <div className="text-label-sm font-semibold uppercase tracking-wider text-sla-outline mb-2">Ingestion Latency Histogram</div>
            <div className="flex items-end gap-1.5 h-14 pt-2 pb-1 border-b border-sla-outline-variant" aria-hidden="true">
              {HISTOGRAM_BARS.map((bar, index) => (
                <span key={index} style={{ height: bar.height, background: bar.color }} className="flex-1 rounded-t-[2px]" />
              ))}
            </div>
            <div className="flex justify-between pt-2 text-label-sm text-sla-outline">
              <span>p50: 12ms</span>
              <span>p95: 38ms</span>
              <span>p99: 104ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-sla-outline-variant/60 bg-sla-surface flex flex-col gap-3">
        <Button variant="danger" size="sm" className="w-full">Purge Ingest Buffer</Button>
        <div className="flex items-center justify-around gap-3 pt-2 border-t border-sla-outline-variant font-mono text-label-md text-sla-secondary">
          <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1.5 text-inherit text-decoration-none whitespace-nowrap">
            <Icon name="memory" size={16} />
            <span>System Diagnostics</span>
          </a>
          <span aria-hidden="true">|</span>
          <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-1.5 text-inherit text-decoration-none whitespace-nowrap">
            <Icon name="settings" size={16} />
            <span>Settings</span>
          </a>
        </div>
      </div>
    </aside>
  )
}