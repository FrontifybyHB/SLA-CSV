import { memo } from 'react'
import { Icon } from '@/shared/ui/Icon'

export const Hero = memo(function Hero() {
  return (
    <section id="product" className="relative pt-12 pb-14 sm:pt-18 sm:pb-22 lg:pt-24 lg:pb-28 xl:pt-30 xl:pb-34 bg-sla-surface-container-lowest border-b border-sla-outline-variant/40 overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[var(--grid-pattern)] bg-[size:32px_32px]" aria-hidden="true" />

      <div className="home-container relative max-w-[56rem] min-w-0">
        <p className="text-label-sm font-mono text-sla-primary font-semibold uppercase tracking-wide mb-3">
          CSV-driven SLA observability
        </p>
        <h1 className="text-[clamp(2rem,1.35rem+3vw,4.75rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-sla-on-surface mb-5 text-balance">
          Upload a CSV. Get trustworthy SLA numbers.
        </h1>

        <p className="text-[clamp(1rem,0.9rem+0.35vw,1.4rem)] leading-[1.55] tracking-[-0.005em] text-sla-secondary mb-8 max-w-[52rem]">
          Import telemetry extracts, let the server parse, normalise, and
          quality-check every row, then inspect per-dataset availability on
          the dashboard — no spreadsheet wrangling.
        </p>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <a href="#dashboard" className="inline-flex items-center justify-center gap-2 px-5.5 py-3 bg-sla-primary-container text-sla-on-primary text-headline-sm font-semibold text-nowrap rounded-sm border-none cursor-pointer transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.06)] hover:bg-sla-primary">
            <Icon name="rocket_launch" size={18} />
            <span>Launch Dashboard</span>
          </a>
          <a href="#api" className="inline-flex items-center justify-center gap-2 px-5.5 py-3 bg-sla-surface-container-lowest border border-sla-outline-variant text-sla-on-surface text-headline-sm font-semibold text-nowrap rounded-sm cursor-pointer transition-colors hover:bg-sla-surface-container-low">
            <Icon name="terminal" size={18} />
            <span>API example</span>
          </a>
        </div>
      </div>
    </section>
  )
})