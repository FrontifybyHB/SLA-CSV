import type { DateRange, LogsResult, SlotsResult, StatsSummary } from "../contracts/reporting.js";

export interface IReportingRepository {
  getStats(
    userId: string,
    datasetIds: string[],
    range: DateRange,
  ): Promise<StatsSummary>;

  getLogs(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<LogsResult>;

  getSlots(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<SlotsResult>;
}