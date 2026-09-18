import { readRuntimeConfig } from './runtime-config'

const DEFAULT_API_BASE = '/api/v1'

function normalizeBase(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

/**
 * API base for all client requests.
 *
 * Resolution order:
 * 1. Runtime config from server `/config.js` (`window.__APP_CONFIG__.apiBase`)
 * 2. Build-time `VITE_API_BASE` (local dev / separate frontend deploy)
 * 3. Same-origin `/api/v1` (monolith default)
 */
export function getApiBase(): string {
  const runtimeBase = readRuntimeConfig()?.apiBase
  if (runtimeBase?.trim()) {
    return normalizeBase(runtimeBase)
  }

  // Build-time override is dev-only. Production monoliths must use /config.js
  // so a developer .env never bakes localhost into the deployed bundle.
  if (import.meta.env.DEV) {
    const buildBase = import.meta.env.VITE_API_BASE as string | undefined
    if (buildBase?.trim()) {
      return normalizeBase(buildBase)
    }
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
