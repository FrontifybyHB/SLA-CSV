import type { ReportingRange } from './reporting.api'

export const reportingKeys = {
  stats: (datasetId: string, range: ReportingRange) =>
    ['reporting', 'stats', datasetId, range.startDate, range.endDate] as const,
  logs: (datasetId: string, range: ReportingRange, page: number, pageSize: number) =>
    ['reporting', 'logs', datasetId, range.startDate, range.endDate, page, pageSize] as const,
  slots: (datasetId: string, range: ReportingRange, page: number, pageSize: number) =>
    ['reporting', 'slots', datasetId, range.startDate, range.endDate, page, pageSize] as const,
  issues: (datasetId: string, page: number, pageSize: number) =>
    ['reporting', 'issues', datasetId, page, pageSize] as const,
}
