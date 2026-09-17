import type { NextFunction, Request, RequestHandler, Response } from "express";

import { uploadRequestSchema } from "../validators/request.validator.js";
import { AppError, ValidationError } from "./appError.js";
import { toFields } from "./validate.js";

export const SUPPORTED_CONTENT_TYPES: string[] = [
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
];

const SUPPORTED_CONTENT_TYPE_SET = new Set(SUPPORTED_CONTENT_TYPES);

export function requireFile(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const bytes = req.body;
      if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
        throw new AppError("CSV file body is empty or missing", 400);
      }

      const contentType = (req.headers["content-type"] ?? "")
        .split(";")[0]
        .trim()
        .toLowerCase();
      if (!SUPPORTED_CONTENT_TYPE_SET.has(contentType)) {
        throw new AppError("Unsupported content type; expected a CSV file", 415);
      }

      const queryFilename = typeof req.query.filename === "string"
        ? req.query.filename
        : undefined;
      const headerFilename =
        typeof req.headers["x-filename"] === "string"
          ? req.headers["x-filename"]
          : undefined;
      const dispositionFilename = parseContentDispositionFilename(
        req.headers["content-disposition"],
      );

      const filename = queryFilename ?? headerFilename ?? dispositionFilename;

      const { error, value } = uploadRequestSchema.validate(
        {
          filename,
          contentType,
          size: bytes.length,
        },
        { abortEarly: false },
      );

      if (error) {
        throw new ValidationError(toFields(error.details));
      }

      req.file = {
        bytes,
        filename: value.filename as string,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

function parseContentDispositionFilename(
  header: string | undefined,
): string | undefined {
  if (!header) {
    return undefined;
  }
  const match = header.match(/filename\s*=\s*"([^"]+)"/i) ??
    header.match(/filename\s*=\s*([^;]+)/i);
  return match?.[1]?.trim();
}