import { memo, useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { useActiveHash, SITE_NAV_LINKS, type SiteNavLink } from './siteNav'

interface TopNavProps {
  links?: readonly SiteNavLink[]
  actions?: ReactNode
  mobileExtra?: ReactNode
  containerClassName?: string
  brandHref?: string
  activeFallback?: string | null
  menuId?: string
}

export const TopNav = memo(function TopNav({
  links = SITE_NAV_LINKS,
  actions,
  mobileExtra,
  containerClassName = '',
  brandHref = '#top',
  activeFallback,
  menuId = 'sla-mobile-menu',
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const hash = useActiveHash()

  const fallback = activeFallback === undefined ? links[0]?.href : activeFallback
  const isActive = useCallback(
    (href: string) => hash === href || ((hash === '' || hash === '#top') && href === fallback),
    [hash, fallback],
  )

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-sla-outline-variant/60 shadow-[0_1px_2px_rgb(16_24_40/0.06)] backdrop-blur-[12px]">
      <div className={`flex items-center justify-between min-h-12 gap-2 sm:gap-3 ${containerClassName}`.trim()}>
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="w-6 h-6 flex-shrink-0 rounded-sm bg-sla-primary-container flex items-center justify-center text-sla-on-primary" aria-hidden="true">
            <Icon name="query_stats" size={15} />
          </div>
          <a className="flex items-center gap-2 min-w-0 text-decoration-none text-sla-on-surface font-semibold text-label-md tracking-[-0.01em]" href={brandHref}>
            <span className="truncate">SLA Monitor</span>
          </a>
        </div>

        <nav className="hidden lg:flex items-center justify-center gap-0.5 list-none m-0 p-0 min-w-0 flex-1" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`px-2.5 py-1.5 rounded-sm text-label-sm font-normal text-sla-secondary whitespace-nowrap transition-colors ${
                isActive(link.href)
                  ? 'text-sla-primary font-semibold bg-sla-primary/8'
                  : 'hover:text-sla-on-surface hover:bg-sla-surface-container-low'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 flex-shrink-0 ml-auto lg:ml-0">
          {actions}
          <IconButton
            label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="lg:hidden w-8 h-8 flex-shrink-0 rounded-sm border border-sla-outline-variant/60 bg-transparent text-sla-on-surface hover:bg-sla-surface-container-low transition-colors"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
          </IconButton>
        </div>
      </div>

      <div id={menuId} hidden={!menuOpen} className="border-t border-sla-outline-variant/60 bg-sla-surface-container-lowest lg:hidden">
        <nav className={`${containerClassName} flex flex-col py-1.5`.trim()} aria-label="Mobile">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`py-2 text-label-sm font-mono text-sla-secondary border-b border-sla-outline-variant/30 transition-colors ${
                isActive(link.href) ? 'text-sla-primary font-semibold' : 'hover:text-sla-on-surface'
              }`}
            >
              {link.label}
            </a>
          ))}
          {mobileExtra}
        </nav>
      </div>
    </header>
  )
})