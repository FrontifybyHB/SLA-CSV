import type { NextFunction, Request, Response } from "express";

import { AppError, ValidationError } from "./appError.js";
import logger from "./logger.js";
import env from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode =
    err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError ? err.message : "Internal Server Error";

  logger.error(message, {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    requestId: req.requestId,
    stack: env.NODE_ENV === "development" ? (err as Error).stack : undefined,
  });

  const bodyMessage =
    statusCode >= 500 && env.NODE_ENV === "production"
      ? "Internal Server Error"
      : message;

  sendError(res, {
    statusCode,
    message: bodyMessage,
    code: err instanceof AppError && err.code ? err.code : undefined,
    requestId: req.requestId,
    errors: err instanceof ValidationError ? err.fields : undefined,
    stack:
      env.NODE_ENV === "development" && statusCode >= 500
        ? (err as Error).stack
        : undefined,
  });
}