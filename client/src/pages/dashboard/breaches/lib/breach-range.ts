import type { ReportingRange } from '@/features/reporting'

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_RANGE_DAYS = 90

/**
 * Full-coverage reporting range for the breach log table: the dataset's
 * real coverage window, falling back to the trailing 30 days and clamped
 * to the server's 90-day maximum.
 */
export function resolveFullRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): ReportingRange | null {
  let end = endDate ? Date.parse(endDate) : Number.NaN
  let start = startDate ? Date.parse(startDate) : Number.NaN
  if (!Number.isFinite(end)) end = Date.now()
  if (!Number.isFinite(start)) start = end - 30 * DAY_MS

  let from = start
  if (end - from > MAX_RANGE_DAYS * DAY_MS) {
    from = end - MAX_RANGE_DAYS * DAY_MS
  }
  if (!(from <= end)) return null
  return { startDate: new Date(from).toISOString(), endDate: new Date(end).toISOString() }
}
