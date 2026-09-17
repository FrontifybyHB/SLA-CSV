import { memo } from 'react'
import { TopNav as SharedTopNav } from '@/shared/ui/TopNav'
import { Icon } from '@/shared/ui/Icon'
import { SITE_NAV_LINKS } from '@/shared/ui/siteNav'

export const TopNav = memo(function TopNav() {
  return (
    <SharedTopNav
      links={SITE_NAV_LINKS}
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
  )
})