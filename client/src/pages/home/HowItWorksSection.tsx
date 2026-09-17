import { memo } from 'react'
import { SectionHeading } from './SectionHeading'

const STEPS = [
  {
    step: 'Step 01',
    title: 'Upload a CSV',
    desc: 'Send the file to POST /api/v1/datasets as text/csv (max 5 MB per the server limit).',
    metaLabel: 'You send',
    metaValue: 'CSV bytes',
  },
  {
    step: 'Step 02',
    title: 'Parse & validate',
    desc: 'Headers, types, and row shapes are checked strictly; bad rows are collected as issues.',
    metaLabel: 'Server runs',
    metaValue: 'Strict parser',
  },
  {
    step: 'Step 03',
    title: 'Normalise & dedupe',
    desc: 'Rows are normalised, fingerprinted by content hash, and duplicates reuse the existing dataset.',
    metaLabel: 'Server runs',
    metaValue: 'Atomic import',
  },
  {
    step: 'Step 04',
    title: 'Inspect the dataset',
    desc: 'Open the dashboard, pick the dataset, and review rows, slots, agents, and coverage.',
    metaLabel: 'You see',
    metaValue: 'Dashboard',
  },
] as const

export const HowItWorksSection = memo(function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-12 sm:py-18 lg:py-24 xl:py-32 bg-sla-surface-container-lowest border-y border-sla-outline-variant/60">
      <div className="home-container">
        <SectionHeading
          eyebrow="How it works"
          title="Upload, import, inspect."
          description="The real pipeline behind the dashboard — no hidden stages, no theoretical timings."
        />

        <div className="bg-sla-surface border border-sla-outline-variant/60 rounded-sm p-5 sm:p-6 lg:p-8 min-w-0">
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 list-none m-0 p-0">
            {STEPS.map((step) => (
              <li key={step.step} className="bg-sla-surface-container-lowest border border-sla-outline-variant/70 rounded-sm p-4 min-w-0 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-label-sm font-mono font-bold text-sla-secondary uppercase tracking-wide">
                    {step.step}
                  </span>
                </div>
                <div className="text-headline-sm font-semibold tracking-[-0.01em] text-sla-on-surface mb-1">
                  {step.title}
                </div>
                <p className="text-body-sm leading-[1.5] text-sla-secondary mb-3 flex-1">
                  {step.desc}
                </p>
                <div className="flex flex-wrap justify-between gap-1 border-t border-sla-outline-variant/30 pt-2 text-label-sm font-mono text-sla-outline">
                  <span>{step.metaLabel}</span>
                  <span className="font-mono">{step.metaValue}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 pt-4 border-t border-sla-outline-variant/50 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 text-label-sm font-mono text-sla-secondary">
            <div className="flex flex-wrap items-center gap-4 min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-sla-tertiary flex-shrink-0" aria-hidden="true" />
                Each import commits atomically — no partial datasets.
              </span>
            </div>
            <div className="text-sla-outline font-mono overflow-hidden text-ellipsis whitespace-nowrap">
              POST /api/v1/datasets · Content-Type: text/csv
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})