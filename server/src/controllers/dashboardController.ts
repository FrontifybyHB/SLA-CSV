import type { NextFunction, Request, Response } from "express";

import type { ReportingService } from "../services/reportingService.js";
import { sendSuccess } from "../utils/apiResponse.js";

interface ReportingQuery {
  startDate: string;
  endDate: string;
  datasetId?: string | string[];
}

interface PaginatedQuery extends ReportingQuery {
  page?: number;
  pageSize?: number;
}

export class DashboardController {
  constructor(private readonly reportingService: ReportingService) {}

  stats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = (req.validated?.query ?? req.query) as ReportingQuery;
      const result = await this.reportingService.getStats(
        req.user!.id,
        toArray(query.datasetId),
        { startDate: new Date(query.startDate), endDate: new Date(query.endDate) },
      );
      sendSuccess(res, {
        statusCode: 200,
        message: "Dashboard stats retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  logs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = (req.validated?.query ?? req.query) as PaginatedQuery;
      const result = await this.reportingService.getLogs(
        req.user!.id,
        toArray(query.datasetId),
        { startDate: new Date(query.startDate), endDate: new Date(query.endDate) },
        query.page ?? 1,
        query.pageSize ?? 50,
      );
      sendSuccess(res, {
        statusCode: 200,
        message: "Logs retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  slots = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = (req.validated?.query ?? req.query) as PaginatedQuery;
      const result = await this.reportingService.getSlots(
        req.user!.id,
        toArray(query.datasetId),
        { startDate: new Date(query.startDate), endDate: new Date(query.endDate) },
        query.page ?? 1,
        query.pageSize ?? 50,
      );
      sendSuccess(res, {
        statusCode: 200,
        message: "Slots retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}