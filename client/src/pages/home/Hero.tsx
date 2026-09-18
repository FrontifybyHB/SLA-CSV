import { memo } from 'react'
import { GraphBackground } from '@/shared/ui/GraphBackground'
import { Icon } from '@/shared/ui/Icon'

const HERO_STATS = [
  { value: '1.2M', label: 'rows / sec', live: true },
  { value: '42ms', label: 'p99 ingest', live: false },
  { value: '99.999%', label: 'SLA bound', live: false },
] as const

export const Hero = memo(function Hero() {
  return (
    <section id="product" className="relative pt-12 pb-14 sm:pt-18 sm:pb-22 lg:pt-24 lg:pb-28 bg-white border-b border-sla-outline-variant/60 overflow-hidden">
      {/* Blueprint graph background with vertical fade */}
      <GraphBackground
        gridSize={22}
        backgroundColor="transparent"
        fade="bottom"
        fadeColor="#ffffff"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 65%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-40%] left-[-8%] h-[22rem] w-[22rem] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #006948 0%, transparent 65%)' }}
      />
      {/* Horizontal telemetry pulse line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px opacity-40"
        style={{ background: 'linear-gradient(to right, transparent, #1d4ed8 30%, #1d4ed8 70%, transparent)' }}
      />

      <div className="home-container relative max-w-[56rem] min-w-0 animate-fade-up">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sla-primary/20 bg-sla-primary/5 px-3 py-1 font-mono text-label-sm font-semibold uppercase tracking-wide text-sla-primary">
          CSV-driven SLA observability
        </p>
        <h1 className="text-[clamp(1.75rem,1.25rem+2.2vw,3rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-sla-on-surface mb-4 text-balance">
          Upload a CSV. Get trustworthy SLA numbers.
        </h1>

        <p className="text-[clamp(0.9375rem,0.875rem+0.25vw,1.0625rem)] leading-[1.6] text-sla-secondary mb-7 max-w-[52rem]">
          Import telemetry extracts, let the server parse, normalise, and
          quality-check every row, then inspect per-dataset availability on
          the dashboard — no spreadsheet wrangling.
        </p>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
          <a href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sla-primary-container text-white text-body-md font-semibold text-nowrap rounded-lg border-none cursor-pointer transition-all duration-150 shadow-sm hover:bg-sla-primary hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.99]">
            <Icon name="rocket_launch" size={17} />
            <span>Launch Dashboard</span>
          </a>
          <a href="#api" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-sla-outline-variant text-sla-on-surface text-body-md font-semibold text-nowrap rounded-lg cursor-pointer transition-all duration-150 shadow-sm hover:bg-sla-surface-container-low hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.99]">
            <Icon name="terminal" size={17} />
            <span>API example</span>
          </a>
        </div>

        {/* Live capability strip over the graph */}
        <dl className="mt-8 flex flex-wrap items-stretch gap-2">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-md border border-sla-outline-variant/70 bg-white/85 backdrop-blur-[4px] shadow-[0_1px_2px_rgb(16_24_40/0.06)]"
            >
              {s.live ? (
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
              ) : null}
              <dt className="order-2 font-mono text-label-sm text-sla-secondary whitespace-nowrap">
                {s.label}
              </dt>
              <dd className="order-1 font-mono text-label-md font-bold text-sla-on-surface whitespace-nowrap">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
})
