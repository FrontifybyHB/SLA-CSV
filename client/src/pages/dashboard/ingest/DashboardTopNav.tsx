import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'

const NAV_LINKS = [
  { label: 'Overview', href: '#overview', active: false },
  { label: 'Datasets', href: '#datasets', active: true },
  { label: 'Breach Logs', href: '#breaches', active: false },
  { label: 'Topology', href: '#topology', active: false },
  { label: 'Pipeline', href: '#pipeline', active: false },
  { label: 'States', href: '#states', active: false },
] as const

export const DashboardTopNav = memo(function DashboardTopNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 border-b border-sla-outline-variant/60 shadow-[0_1px_2px_rgb(16_24_40/0.06)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between gap-2 h-[3.25rem] max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span aria-hidden="true" className="w-[0.625rem] h-[0.625rem] rounded-[2px] bg-sla-primary-container flex-shrink-0" />
              <span className="font-mono text-label-md font-bold tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
                SLA_MONITOR
                <span className="font-normal text-sla-outline"> // PROD-US-EAST</span>
              </span>
            </div>

            <span aria-hidden="true" className="w-px h-4 bg-sla-outline-variant flex-shrink-0 hidden md:block" />

            <div className="hidden md:flex items-center min-w-0">
              <label htmlFor="ingest-search" className="sr-only">
                Filter telemetry
              </label>
              <span className="absolute left-2.5 text-sla-outline pointer-events-none flex">
                <Icon name="search" size={16} />
              </span>
              <input
                id="ingest-search"
                ref={searchRef}
                type="text"
                placeholder="FILTER_TELEMETRY [CMD+K]"
                className="w-[10rem] sm:w-[14rem] lg:w-[16rem] pl-8 pr-3 py-1.5 border border-sla-outline-variant rounded-sm bg-sla-surface text-sla-on-surface font-mono text-label-md placeholder:text-sla-outline focus:outline-none focus:border-sla-primary focus:bg-white focus:shadow-focus"
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={`px-3 py-2 font-mono text-label-md font-medium text-sla-secondary text-decoration-none whitespace-nowrap ${
                  link.active
                    ? 'text-sla-primary font-semibold border-b-2 border-sla-primary bg-sla-primary/6 rounded-t-sm rounded-b-none'
                    : 'hover:text-sla-on-surface'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 border border-emerald-300 rounded-sm bg-emerald-50 font-mono text-label-sm font-semibold text-emerald-800 whitespace-nowrap">
              <span aria-hidden="true" className="w-[0.375rem] h-[0.375rem] rounded-full bg-emerald-500 animate-pulse" />
              LIVE: 42ms
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-sm text-sla-secondary whitespace-nowrap">
              UTC 14:02:18
            </span>

            <div className="hidden md:flex items-center gap-0.5 border-l border-sla-outline-variant pl-2.5 ml-1">
              <IconButton label="Terminal readout" className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
                <Icon name="terminal" size={18} />
              </IconButton>
              <IconButton label="System help" className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
                <Icon name="help" size={18} />
              </IconButton>
              <IconButton label="Tune thresholds" className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
                <Icon name="tune" size={18} />
              </IconButton>
            </div>

            <span className="inline-flex items-center justify-center w-7 h-7 ml-1 border border-sky-300 rounded-sm bg-sky-50 text-sla-primary font-mono text-label-md font-bold flex-shrink-0" title="Operator account">
              OP
            </span>

            <IconButton
              label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="ingest-mobile-menu"
              className="p-1.5 rounded-sm border-none bg-transparent text-sla-secondary hover:bg-sla-surface-container-low lg:hidden"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
            </IconButton>
          </div>
        </div>

        <div id="ingest-mobile-menu" hidden={!menuOpen} className="border-t border-sla-outline-variant/60 bg-white lg:hidden">
          <nav className="max-w-[1600px] mx-auto px-4 py-2" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className={`py-2.5 font-mono text-label-md text-sla-secondary border-b border-sla-outline-variant/30 ${
                  link.active ? 'text-sla-primary font-semibold' : 'hover:text-sla-on-surface'
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-emerald-300 rounded-sm bg-emerald-50 font-mono text-label-sm font-semibold text-emerald-800 whitespace-nowrap">
                <span aria-hidden="true" className="w-[0.375rem] h-[0.375rem] rounded-full bg-emerald-500 animate-pulse" />
                LIVE: 42ms
              </span>
              <span className="inline-block px-2.5 py-1 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-sm text-sla-secondary whitespace-nowrap">
                UTC 14:02:18
              </span>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
})