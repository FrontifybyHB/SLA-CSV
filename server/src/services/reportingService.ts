import type { DateRange, LogsResult, SlotsResult, StatsSummary } from "../contracts/reporting.js";
import type { IReportingRepository } from "../contracts/reporting.interface.js";
import { AppError } from "../middlewares/appError.js";

const MAX_RANGE_DAYS = 90;

export class ReportingService {
  constructor(private readonly repository: IReportingRepository) {}

  async getStats(userId: string, datasetIds: string[], range: DateRange): Promise<StatsSummary> {
    const resolved = this.resolveRange(range);
    return this.repository.getStats(userId, datasetIds, resolved);
  }

  async getLogs(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<LogsResult> {
    const resolved = this.resolveRange(range);
    const safePage = Math.max(page, 1);
    const safePageSize = Math.min(Math.max(pageSize, 1), 500);
    return this.repository.getLogs(userId, datasetIds, resolved, safePage, safePageSize);
  }

  async getSlots(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<SlotsResult> {
    const resolved = this.resolveRange(range);
    const safePage = Math.max(page, 1);
    const safePageSize = Math.min(Math.max(pageSize, 1), 500);
    return this.repository.getSlots(userId, datasetIds, resolved, safePage, safePageSize);
  }

  private resolveRange(range: DateRange): DateRange {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError("Invalid date range", 400);
    }
    if (start > end) {
      throw new AppError("startDate must be before or equal to endDate", 400);
    }
    if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
    }

    const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endMs = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) +
      24 * 60 * 60 * 1000 - 1;

    return {
      startDate: new Date(startMs),
      endDate: new Date(endMs),
    };
  }
}