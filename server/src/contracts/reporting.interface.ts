import type { DateRange, IssuesResult, LogsResult, SlotsResult, StatsSummary } from "../contracts/reporting.js";

export interface ReportingFilters {
  service?: string;
  region?: string;
  status?: string;
}

export interface IReportingRepository {
  getStats(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    filters?: ReportingFilters,
  ): Promise<StatsSummary>;

  getLogs(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
    filters?: ReportingFilters,
  ): Promise<LogsResult>;

  getSlots(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
    filters?: ReportingFilters,
  ): Promise<SlotsResult>;

  getIssues(
    userId: string,
    datasetIds: string[],
    page: number,
    pageSize: number,
  ): Promise<IssuesResult>;
}