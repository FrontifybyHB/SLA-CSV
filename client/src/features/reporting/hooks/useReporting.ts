import { useQuery } from '@tanstack/react-query'
import {
  getReportingIssues,
  getReportingLogs,
  getReportingSlots,
  getReportingStats,
  type ReportingRange,
} from '../api/reporting.api'
import { reportingKeys } from '../api/reporting.keys'

function isRangeValid(range: ReportingRange | null): range is ReportingRange {
  if (!range) return false
  if (!range.startDate || !range.endDate) return false
  const start = Date.parse(range.startDate)
  const end = Date.parse(range.endDate)
  return Number.isFinite(start) && Number.isFinite(end) && start <= end
}

export function isReportingEnabled(datasetId: string | null, range: ReportingRange | null) {
  return Boolean(datasetId) && isRangeValid(range)
}

export function useReportingStats(datasetId: string | null, range: ReportingRange | null) {
  const enabled = isReportingEnabled(datasetId, range)
  return useQuery({
    queryKey: reportingKeys.stats(datasetId ?? '', (range ?? { startDate: '', endDate: '' }) as ReportingRange),
    queryFn: ({ signal }) => getReportingStats(datasetId as string, range as ReportingRange, undefined, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useReportingLogs(
  datasetId: string | null,
  range: ReportingRange | null,
  page = 1,
  pageSize = 20,
) {
  const enabled = isReportingEnabled(datasetId, range)
  return useQuery({
    queryKey: reportingKeys.logs(
      datasetId ?? '',
      (range ?? { startDate: '', endDate: '' }) as ReportingRange,
      page,
      pageSize,
    ),
    queryFn: ({ signal }) =>
      getReportingLogs(datasetId as string, range as ReportingRange, page, pageSize, undefined, signal),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useReportingSlots(
  datasetId: string | null,
  range: ReportingRange | null,
  page = 1,
  pageSize = 100,
) {
  const enabled = isReportingEnabled(datasetId, range)
  return useQuery({
    queryKey: reportingKeys.slots(
      datasetId ?? '',
      (range ?? { startDate: '', endDate: '' }) as ReportingRange,
      page,
      pageSize,
    ),
    queryFn: ({ signal }) =>
      getReportingSlots(datasetId as string, range as ReportingRange, page, pageSize, undefined, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useReportingIssues(datasetId: string | null, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: reportingKeys.issues(datasetId ?? '', page, pageSize),
    queryFn: ({ signal }) =>
      getReportingIssues(datasetId as string, page, pageSize, signal),
    enabled: Boolean(datasetId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
