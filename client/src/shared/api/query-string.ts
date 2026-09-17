export type QueryValue = string | number | boolean | null | undefined

export type QueryValues = Record<string, QueryValue>

export function buildQueryString(query: QueryValues): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}