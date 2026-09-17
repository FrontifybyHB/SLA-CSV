export interface DashboardSearchParams {
  dataset: string | null
  from: string | null
  to: string | null
  service: string | null
  region: string | null
}

export const emptyDashboardSearch: DashboardSearchParams = {
  dataset: null,
  from: null,
  to: null,
  service: null,
  region: null,
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/
const TOKEN_RE = /^[A-Za-z0-9_.-]{1,64}$/

function validToken(value: string | null, pattern: RegExp): string | null {
  if (!value || !pattern.test(value)) return null
  return value
}

function validDateOnly(value: string | null): string | null {
  if (!value || !DATE_ONLY_RE.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  return roundTrips ? value : null
}

export function parseDashboardSearch(search: string): DashboardSearchParams {
  const raw = new URLSearchParams(search)
  return {
    dataset: validToken(raw.get('dataset'), TOKEN_RE),
    from: validDateOnly(raw.get('from')),
    to: validDateOnly(raw.get('to')),
    service: validToken(raw.get('service'), TOKEN_RE),
    region: validToken(raw.get('region'), TOKEN_RE),
  }
}

export function serializeDashboardSearch(params: DashboardSearchParams): string {
  const raw = new URLSearchParams()
  if (params.dataset) raw.set('dataset', params.dataset)
  if (params.from) raw.set('from', params.from)
  if (params.to) raw.set('to', params.to)
  if (params.service) raw.set('service', params.service)
  if (params.region) raw.set('region', params.region)
  const query = raw.toString()
  return query ? `?${query}` : ''
}