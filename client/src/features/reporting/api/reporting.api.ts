import { api } from '@/shared/api/client'

export interface StatsSummary {
  datasetIds: string[]
  totalSlots: number
  uptimeSeconds: number
  downtimeSeconds: number
  unknownSeconds: number
  availabilityPct: number
  averageLatencyMs: number | null
  counts: {
    up: number
    down: number
    unknown: number
    mixed: number
  }
}

export interface ObservationLog {
  row: number
  datasetId: string
  service: string
  agentId: string
  timestamp: string
  latencyMs: number | null
  status: string
  region: string | null
}

export interface LogsResult {
  observations: ObservationLog[]
  total: number
  page: number
  pageSize: number
}

export interface SlotRecord {
  datasetId: string
  service: string
  slotKey: string
  startTime: string
  endTime: string
  durationSeconds: number
  uptimeSeconds: number
  downtimeSeconds: number
  unknownSeconds: number
  averageLatencyMs: number | null
  status: string
}

export interface IssueRecord {
  id: number
  datasetId: string
  rowNumber: number
  field: string
  message: string
}

export interface IssuesResult {
  issues: IssueRecord[]
  total: number
  page: number
  pageSize: number
}

export interface SlotsResult {
  slots: SlotRecord[]
  total: number
  page: number
  pageSize: number
  from: string
  to: string
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface ReportingRange {
  startDate: string
  endDate: string
}

export interface ReportingFilters {
  service?: string
  region?: string
  status?: string
}

/**
 * The reporting endpoints REQUIRE startDate+endDate (Joi-validated ISO).
 * Calling them without dates was the other "first call errors" source, so
 * every helper here takes an explicit range — no optional dates.
 */
function rangeQuery(range: ReportingRange, extra?: Record<string, string | number | undefined>) {
  return {
    startDate: range.startDate,
    endDate: range.endDate,
    ...extra,
  }
}

export function getReportingStats(
  datasetId: string,
  range: ReportingRange,
  filters?: ReportingFilters,
  signal?: AbortSignal,
): Promise<StatsSummary> {
  return api
    .get<ApiEnvelope<StatsSummary>>(
      '/reporting/stats',
      rangeQuery(range, { datasetId, ...filters }),
      { signal },
    )
    .then((res) => res.data)
}

export function getReportingLogs(
  datasetId: string,
  range: ReportingRange,
  page = 1,
  pageSize = 20,
  filters?: ReportingFilters,
  signal?: AbortSignal,
): Promise<LogsResult> {
  return api
    .get<ApiEnvelope<LogsResult>>(
      '/reporting/logs',
      rangeQuery(range, { datasetId, page, pageSize, ...filters }),
      { signal },
    )
    .then((res) => res.data)
}

export function getReportingSlots(
  datasetId: string,
  range: ReportingRange,
  page = 1,
  pageSize = 100,
  filters?: ReportingFilters,
  signal?: AbortSignal,
): Promise<SlotsResult> {
  return api
    .get<ApiEnvelope<SlotsResult>>(
      '/reporting/slots',
      rangeQuery(range, { datasetId, page, pageSize, ...filters }),
      { signal },
    )
    .then((res) => res.data)
}

export function getReportingIssues(
  datasetId: string,
  page = 1,
  pageSize = 50,
  signal?: AbortSignal,
): Promise<IssuesResult> {
  return api
    .get<ApiEnvelope<IssuesResult>>(
      '/reporting/issues',
      { datasetId, page, pageSize },
      { signal },
    )
    .then((res) => res.data)
}
