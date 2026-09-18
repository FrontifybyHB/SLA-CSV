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

  const isProduction = env.NODE_ENV === "production";
  // Never log stack traces in production, even if NODE_ENV is misconfigured
  const shouldLogStack = !isProduction;

  logger.error(message, {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    requestId: req.requestId,
    stack: shouldLogStack ? (err as Error).stack : undefined,
  });

  // In production, never expose internal error details
  const bodyMessage =
    statusCode >= 500 && isProduction
      ? "Internal Server Error"
      : message;

  sendError(res, {
    statusCode,
    message: bodyMessage,
    code: err instanceof AppError && err.code ? err.code : undefined,
    requestId: req.requestId,
    errors: err instanceof ValidationError ? err.fields : undefined,
    stack:
      shouldLogStack && statusCode >= 500
        ? (err as Error).stack
        : undefined,
  });
}