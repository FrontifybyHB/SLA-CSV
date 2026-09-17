import { TopNav } from '@/shared/ui/TopNav'
import { Hero } from './Hero'
import { FeatureGrid } from './FeatureGrid'
import { HowItWorksSection } from './HowItWorksSection'
import { ApiExampleSection } from './ApiExampleSection'
import { CtaSection } from './CtaSection'
import { AppFooter } from '@/shared/ui/AppFooter'
import { Icon } from '@/shared/ui/Icon'
import { SITE_NAV_LINKS, HOME_FOOTER_LINKS } from '@/shared/ui/siteNav'

export function SlaMonitorPage() {
  return (
    <div className="min-h-screen bg-sla-bg text-sla-on-surface font-sla antialiased" id="top">
      <a href="#product" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-sla-primary-container focus:text-sla-on-primary focus:rounded-sm focus:font-semibold focus:text-sm">
        Skip to content
      </a>

      <TopNav
        links={SITE_NAV_LINKS}
        activeFallback="#product"
        containerClassName="home-container"
        brandHref="#top"
        actions={
          <>
            <a className="hidden sm:inline-flex items-center px-3 py-2 text-label-md text-sla-secondary text-decoration-none rounded-sm hover:text-sla-on-surface hover:bg-sla-surface-container-low transition-colors whitespace-nowrap" href="#login">
              Sign in
            </a>
            <a className="inline-flex items-center justify-center gap-1.5 min-w-0 max-w-[11rem] px-3.5 py-2 bg-sla-primary-container text-sla-on-primary text-label-md font-medium text-decoration-none rounded-sm border-none cursor-pointer transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.06)] hover:bg-sla-primary whitespace-nowrap" href="#dashboard">
              <span className="truncate">Open Dashboard</span>
              <Icon name="arrow_forward" size={16} />
            </a>
          </>
        }
        mobileExtra={
          <a href="login" className="py-2.5 text-label-md font-mono text-sla-secondary border-b border-sla-outline-variant/30 hover:text-sla-on-surface transition-colors">
            Sign in
          </a>
        }
      />

      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorksSection />
        <ApiExampleSection />
        <CtaSection />
      </main>
      <AppFooter links={HOME_FOOTER_LINKS} tagline="CSV-driven SLA observability." />
    </div>
  )
}