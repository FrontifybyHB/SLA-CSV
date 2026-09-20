import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { IconButton } from './IconButton'

export interface DashboardHeaderLink {
  label: string
  /** Router route (renders a <Link>). */
  to?: string
  /** In-page anchor (renders a plain <a>), e.g. "#breach-logs". */
  href?: string
}

export interface DashboardHeaderSearch {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

export interface DashboardHeaderProps {
  /** Where the brand links. Defaults to the main dashboard. */
  brandTo?: string
  /** Small pill next to the brand, e.g. the active dataset filename. */
  eyebrow?: ReactNode
  /** Optional filter input (with ⌘K shortcut). Omit to hide. */
  search?: DashboardHeaderSearch
  /** Desktop + mobile nav links; active state follows the router. */
  links: DashboardHeaderLink[]
  /** Status pill on the right, e.g. live/sync/error. */
  status?: ReactNode
  /** Extra icon buttons on the right. */
  actions?: ReactNode
  /** Initials avatar; omit to hide. */
  userLabel?: string
  onSignOut?: () => void
  signingOut?: boolean
}

function useNowUtc(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })
}

/**
 * Single shared header for every dashboard page (ingest + overview).
 * One brand, one nav, one clock, one mobile menu — no per-page clones.
 */
export const DashboardHeader = memo(function DashboardHeader({
  brandTo = '/dashboard',
  eyebrow,
  search,
  links,
  status,
  actions,
  userLabel,
  onSignOut,
  signingOut = false,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()
  const nowUtc = useNowUtc()

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-sla-outline-variant/60 shadow-[0_1px_2px_rgb(16_24_40/0.06)] backdrop-blur-[12px]">
      <div className="flex items-center justify-between gap-2 h-12 max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to={brandTo} className="flex items-center gap-1.5 min-w-0 text-decoration-none text-inherit">
            <span className="w-5 h-5 rounded-sm bg-sla-primary-container flex items-center justify-center text-white shrink-0">
              <Icon name="monitoring" size={13} />
            </span>
            <span className="font-semibold text-label-sm whitespace-nowrap">SLA Monitor</span>
            {eyebrow ? (
              <span className="hidden sm:inline-block font-mono text-[11px] px-1.5 py-px rounded-full bg-sla-surface border border-sla-outline-variant text-sla-secondary whitespace-nowrap max-w-[12rem] overflow-hidden text-ellipsis">
                {eyebrow}
              </span>
            ) : null}
          </Link>

          {search ? (
            <div className="hidden lg:flex items-center gap-1.5 bg-sla-surface border border-sla-outline-variant rounded-sm px-2 py-0.5 w-40 shrink-0">
              <Icon name="search" size={12} />
              <input
                ref={searchRef}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? 'Filter… (⌘K)'}
                aria-label={search.ariaLabel ?? 'Filter'}
                className="bg-transparent border-0 font-mono text-label-sm w-full focus:outline-none placeholder:text-sla-outline text-sla-on-surface"
              />
            </div>
          ) : null}
        </div>

        <nav className="hidden md:flex items-center gap-0.5 shrink-0" aria-label="Primary">
          {links.map((link) => {
            const active = link.to !== undefined && location.pathname === link.to
            const className = `px-2.5 py-1.5 rounded-sm font-mono text-label-sm whitespace-nowrap text-decoration-none transition-colors ${
              active
                ? 'text-sla-primary font-semibold bg-sla-primary/8'
                : 'text-sla-secondary hover:text-sla-on-surface hover:bg-sla-surface-container-low'
            }`
            if (link.href !== undefined) {
              return (
                <a key={link.label} href={link.href} className={className}>
                  {link.label}
                </a>
              )
            }
            return (
              <Link
                key={link.label}
                to={link.to ?? '#'}
                aria-current={active ? 'page' : undefined}
                className={className}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          {status}
          <span className="hidden lg:inline-block px-2 py-0.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-[11px] text-sla-secondary whitespace-nowrap">
            UTC {nowUtc}
          </span>

          {actions ? (
            <div className="hidden md:flex items-center gap-0.5 border-l border-sla-outline-variant pl-1.5 ml-0.5">
              {actions}
            </div>
          ) : null}

          {userLabel ? (
            <span
              className="hidden sm:inline-flex items-center justify-center w-6 h-6 border border-sky-300 rounded-sm bg-sky-50 text-sla-primary font-mono text-[11px] font-bold shrink-0"
              title="Operator account"
            >
              {userLabel}
            </span>
          ) : null}

          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="hidden lg:inline-flex px-2 py-1 rounded-sm border border-sla-danger/50 font-mono text-label-sm text-sla-danger hover:bg-sla-danger-soft hover:border-sla-danger disabled:opacity-55 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-danger focus-visible:ring-offset-1"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          ) : null}

          <IconButton
            label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            className="md:hidden"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
          </IconButton>
        </div>
      </div>

        {menuOpen ? (
        <nav className="border-t border-sla-outline-variant/60 bg-white md:hidden px-4 py-1.5" aria-label="Mobile">
          {links.map((link) => {
            const active = link.to !== undefined && location.pathname === link.to
            const className = `block py-2 font-mono text-label-sm border-b border-sla-outline-variant/30 text-decoration-none ${
              active ? 'text-sla-primary font-semibold' : 'text-sla-secondary'
            }`
            if (link.href !== undefined) {
              return (
                <a key={link.label} href={link.href} onClick={closeMenu} className={className}>
                  {link.label}
                </a>
              )
            }
            return (
              <Link key={link.label} to={link.to ?? '#'} onClick={closeMenu} className={className}>
                {link.label}
              </Link>
            )
          })}
          {search ? (
            <div className="flex items-center gap-2 bg-sla-surface border border-sla-outline-variant rounded-sm px-3 py-2 mt-2">
              <Icon name="search" size={14} />
              <input
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? 'Filter…'}
                aria-label={search.ariaLabel ?? 'Filter'}
                className="bg-transparent border-0 font-mono text-label-md w-full focus:outline-none text-sla-on-surface"
              />
            </div>
          ) : null}
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="block w-full text-left py-2.5 font-mono text-label-md font-semibold text-sla-danger disabled:opacity-55"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          ) : null}
        </nav>
      ) : null}
    </header>
  )
})
