import { memo } from 'react'

export interface AppFooterLink {
  label: string
  href: string
}

interface AppFooterProps {
  links: readonly AppFooterLink[]
  tagline: string
}

export const AppFooter = memo(function AppFooter({ links, tagline }: AppFooterProps) {
  return (
    <footer className="w-full bg-sla-surface-container-lowest border-t border-sla-outline-variant">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 sm:justify-between sm:items-center sm:text-left text-center">
        <div className="flex flex-col items-center gap-1.5 sm:items-start min-w-0">
          <span className="text-headline-sm font-bold text-sla-on-surface whitespace-nowrap">SLA Monitor</span>
          <span className="text-body-sm text-sla-secondary max-w-[60ch]">
            &copy; {new Date().getFullYear()} SLA Monitor. {tagline}
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 font-mono text-label-sm text-sla-secondary" aria-label="Footer">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-decoration-none text-sla-secondary whitespace-nowrap transition-colors px-0.5 py-0.5 hover:text-sla-on-surface focus:outline-none focus:ring-2 focus:ring-sla-primary focus:ring-offset-2">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
})