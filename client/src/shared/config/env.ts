/**
 * Single place that reads frontend environment variables.
 *
 * Only ONE variable is needed:
 * - VITE_API_BASE: where the API lives. Defaults to the same-origin
 *   relative path `/api/v1` so dev (Vite proxy) and single-domain
 *   production need no CORS at all and skip the preflight round-trip.
 *   Set it to an absolute URL (e.g. https://api.example.com/api/v1) only
 *   when the backend is on a different origin.
 */
function normalizeBase(value: string | undefined): string {
  const raw = (value ?? '/api/v1').trim()
  if (raw === '') return '/api/v1'
  return raw.replace(/\/+$/, '')
}

export const apiBase = normalizeBase(import.meta.env.VITE_API_BASE)

/** Origin of the API (for display snippets), without the /api/v1 suffix. */
export const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, '') || '/'
