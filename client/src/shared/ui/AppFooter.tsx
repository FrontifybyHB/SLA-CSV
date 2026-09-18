import { memo } from 'react'

export interface AppFooterLink {
  label: string
  href: string
}

interface AppFooterProps {
  links: readonly AppFooterLink[]
  tagline: string
}

/**
 * Slim homepage footer: brand + tagline on the left,
 * section links on the right. One compact row, no oversized type.
 */
export const AppFooter = memo(function AppFooter({ links, tagline }: AppFooterProps) {
  return (
    <footer className="w-full bg-white border-t border-sla-outline-variant/60">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-label-md font-semibold text-sla-on-surface whitespace-nowrap">
            SLA Monitor
          </span>
          <span className="text-label-sm text-sla-secondary truncate">
            &copy; {new Date().getFullYear()} · {tagline}
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-label-sm text-sla-secondary"
          aria-label="Footer"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-decoration-none text-sla-secondary whitespace-nowrap transition-colors hover:text-sla-on-surface focus:outline-none focus:ring-2 focus:ring-sla-primary focus:ring-offset-2 rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
})
