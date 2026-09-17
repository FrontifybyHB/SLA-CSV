import type { NextFunction, Request, Response } from "express";

import type { ImportService } from "../services/importService.js";
import { AppError, AuthenticationError, ValidationError } from "../middlewares/appError.js";
import { sendSuccess } from "../utils/apiResponse.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DatasetController {
  constructor(private readonly importService: ImportService) {}

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const result = await this.importService.execute(
        {
          bytes: req.file!.bytes,
          filename: req.file!.filename,
        },
        userId,
      );

      sendSuccess(res, {
        statusCode: result.duplicate ? 200 : 201,
        message: result.duplicate
          ? "Dataset already exists, returning existing dataset"
          : "Dataset uploaded successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const datasets = await this.importService.listDatasets(userId);
      sendSuccess(res, {
        statusCode: 200,
        message: "Datasets retrieved successfully",
        data: datasets,
      });
    } catch (err) {
      next(err);
    }
  };

  detail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const id = typeof req.params.id === "string" ? req.params.id : "";
      if (!UUID_PATTERN.test(id)) {
        throw new ValidationError({ id: "Dataset id must be a UUID" });
      }
      const dataset = await this.importService.getDataset(id, userId);
      if (!dataset) {
        throw new AppError("Dataset not found", 404, "NOT_FOUND");
      }
      sendSuccess(res, {
        statusCode: 200,
        message: "Dataset retrieved successfully",
        data: dataset,
      });
    } catch (err) {
      next(err);
    }
  };
}

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError("Authentication required", "UNAUTHORIZED", 401);
  }
  return userId;
}