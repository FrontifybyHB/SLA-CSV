import { useEffect, useState } from 'react'

export interface SiteNavLink {
  label: string
  href: string
}

/** Primary sections of the marketing homepage. */
export const SITE_NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'API', href: '#api' },
] as const satisfies readonly SiteNavLink[]

/** Minimal nav for the login page (same component, fewer links). */
export const AUTH_NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Dashboard', href: '#dashboard' },
] as const satisfies readonly SiteNavLink[]

export const HOME_FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'API', href: '#api' },
  { label: 'Dashboard', href: '#dashboard' },
] as const satisfies readonly SiteNavLink[]

export const AUTH_FOOTER_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Dashboard', href: '#dashboard' },
] as const satisfies readonly SiteNavLink[]

/**
 * Tracks the URL hash so nav active-states stay in sync with the router
 * and with in-page section anchors. One hook, every navbar.
 */
export function useActiveHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}
