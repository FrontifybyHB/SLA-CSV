const PRODUCTION_API_BASE = 'https://sla-csv-seven.vercel.app/api/v1'

/**
 * API base for all client requests.
 * Hardcoded to production URL.
 */
export function getApiBase(): string {
  return PRODUCTION_API_BASE
}

/** Returns the absolute API base (already absolute in production). */
export function getAbsoluteApiBase(): string {
  return PRODUCTION_API_BASE
}
