import { memo } from 'react'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'
import { SectionHeading } from './SectionHeading'

interface Feature {
  icon: IconName
  badge: string
  title: string
  description: string
}

const FEATURES: readonly Feature[] = [
  {
    icon: 'table_rows',
    badge: 'Strict parsing',
    title: 'CSV ingestion with validation',
    description:
      'Header, type, and row-shape checks run on upload. Malformed rows are rejected and reported instead of silently poisoning your SLA math.',
  },
  {
    icon: 'fact_check',
    badge: 'Normalise + dedupe',
    title: 'Idempotent imports',
    description:
      'Rows are normalised and fingerprinted by content hash, so re-uploading the same file reuses the existing dataset instead of double-counting.',
  },
  {
    icon: 'troubleshoot',
    badge: 'Quality report',
    title: 'Per-import issue list',
    description:
      'Every import returns observation, slot, and issue counts, so you can see exactly what was accepted, filled, or flagged.',
  },
  {
    icon: 'query_stats',
    badge: 'Dashboard',
    title: 'Dataset availability at a glance',
    description:
      'Pick any imported dataset and inspect rows, slots, agents, coverage window, and policy version in one place.',
  },
] as const

export const FeatureGrid = memo(function FeatureGrid() {
  return (
    <section id="features" className="py-12 sm:py-18 lg:py-24 xl:py-32 bg-sla-bg">
      <div className="home-container">
        <SectionHeading
          eyebrow="What it does"
          title="From raw CSV to answers, without the spreadsheet."
          description="Four capabilities that match what the API actually implements today."
          align="between"
        />

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="bg-sla-surface-container-lowest border border-sla-outline-variant/60 rounded-sm p-5 sm:p-6 lg:p-8 min-w-0 transition-colors hover:border-sla-outline">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-9 h-9 flex-shrink-0 rounded-sm bg-sla-surface-container flex items-center justify-center text-sla-primary" aria-hidden="true">
                  <Icon name={feature.icon} size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-sm text-label-sm font-mono font-semibold border border-sla-outline-variant/40 bg-sla-surface-container text-sla-primary whitespace-nowrap">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-[clamp(1.125rem,1.05rem+0.4vw,1.5rem)] leading-[1.3] font-semibold tracking-[-0.015em] text-sla-on-surface mb-2">
                {feature.title}
              </h3>
              <p className="text-body-md leading-body-md text-sla-secondary mb-0">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
})