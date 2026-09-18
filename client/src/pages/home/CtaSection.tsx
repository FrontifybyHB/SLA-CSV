import { memo } from 'react'
import { Icon } from '@/shared/ui/Icon'

export const CtaSection = memo(function CtaSection() {
  return (
    <section className="py-12 sm:py-18 lg:py-24 xl:py-32 bg-sla-surface border-b border-sla-outline-variant/60 text-center">
      <div className="home-container">
        <div className="max-w-[40rem] mx-auto">
          <h2 className="text-[clamp(1.5rem,1.3rem+1vw,3rem)] leading-[1.2] font-semibold tracking-[-0.02em] text-sla-on-surface mb-3 text-balance">
            Start with your first CSV.
          </h2>
          <p className="text-body-md leading-body-md text-sla-secondary mb-8">
            Sign in, upload an extract, and inspect the dataset on the
            dashboard. Re-uploads are detected automatically.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4 max-w-[28rem] mx-auto mb-4">
            <a href="/dashboard" className="inline-flex items-center justify-center gap-2 min-h-[2.5rem] px-5 py-2.5 bg-sla-primary-container text-sla-on-primary text-headline-sm font-semibold text-nowrap rounded-sm border-none cursor-pointer transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.06)] hover:bg-sla-primary">
              <Icon name="rocket_launch" size={18} />
              <span>Open Dashboard</span>
            </a>
            <a href="/login" className="inline-flex items-center justify-center gap-1.5 min-h-[2.5rem] px-5 py-2.5 bg-transparent border border-sla-outline-variant text-sla-on-surface text-headline-sm font-semibold text-nowrap rounded-sm cursor-pointer transition-colors hover:bg-sla-surface-container-low">
              <span>Sign in</span>
              <Icon name="arrow_forward" size={16} />
            </a>
          </div>

          <p className="text-label-sm font-mono text-sla-secondary">
            Bearer-token API &bull; 5 MB per upload &bull; Atomic imports
          </p>
        </div>
      </div>
    </section>
  )
})