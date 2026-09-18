const DEFAULT_API_BASE = '/api/v1'

/**
 * API base for all client requests.
 *
 * - Production (same domain): defaults to `/api/v1` on the current host.
 * - Local dev: Vite proxies `/api` to the backend, so the same default works.
 * - Separate API host: set `VITE_API_BASE` at build time, e.g.
 *   `https://your-domain.com/api/v1`.
 */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE as string | undefined
  if (configured?.trim()) {
    return configured.trim().replace(/\/+$/, '')
  }
  return DEFAULT_API_BASE
}

/** Same as getApiBase(), but resolves relative paths against window.location. */
export function getAbsoluteApiBase(): string {
  const base = getApiBase()
  if (/^https?:\/\//i.test(base)) {
    return base
  }
  if (typeof window !== 'undefined') {
    const path = base.startsWith('/') ? base : `/${base}`
    return `${window.location.origin}${path}`.replace(/\/+$/, '')
  }
  return base
}
