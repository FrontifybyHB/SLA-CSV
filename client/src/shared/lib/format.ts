const NA = '—'

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return NA
  return value.toLocaleString('en-US')
}

export function formatUtcDateTime(value: string | null | undefined): string {
  if (!value) return NA
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })} UTC`
}