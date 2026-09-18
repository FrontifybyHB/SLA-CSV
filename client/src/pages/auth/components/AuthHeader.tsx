import { memo } from 'react'
import { TopNav as SharedTopNav } from '@/shared/ui/TopNav'
import { AUTH_NAV_LINKS } from '@/shared/ui/siteNav'

export const AuthHeader = memo(function AuthHeader() {
  return (
    <SharedTopNav
      links={AUTH_NAV_LINKS}
      activeFallback={null}
      containerClassName="auth-container"
      brandHref="/"
      menuId="auth-mobile-menu"
      actions={
        <>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-sla-surface-container border border-sla-outline-variant/40">
            <span className="relative flex w-2 h-2 flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-sla-tertiary opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-sla-tertiary" />
            </span>
            <span className="hidden sm:inline text-label-sm text-sla-tertiary font-semibold tracking-[-0.01em] whitespace-nowrap">
              ALL SYSTEMS OPERATIONAL
            </span>
            <span className="hidden md:inline text-label-sm text-sla-secondary whitespace-nowrap">| 99.998% SLA</span>
          </div>
          <a className="hidden sm:block text-label-md font-mono text-sla-secondary text-decoration-none whitespace-nowrap transition-colors hover:text-sla-primary" href="/#api">
            Docs
          </a>
        </>
      }
      mobileExtra={
        <a href="/" className="py-2.5 text-label-md font-mono text-sla-secondary border-b border-sla-outline-variant/30 hover:text-sla-on-surface transition-colors">
          Back to Home
        </a>
      }
    />
  )
})