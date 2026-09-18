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

      // Validate content is valid UTF-8 text (not binary)
      // This prevents uploading executables, images, etc. renamed as .csv
      try {
        const text = bytes.toString("utf-8");
        // Check for null bytes which indicate binary content
        if (text.includes("\0")) {
          throw new AppError("CSV file appears to be binary, not text", 400);
        }
        // Basic heuristic: CSV should have reasonable printable character ratio
        const printableRatio = (text.match(/[\x20-\x7E\r\n\t]/g) ?? []).length / text.length;
        if (printableRatio < 0.85) {
          throw new AppError("CSV file contains excessive non-printable characters", 400);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("CSV file is not valid UTF-8 text", 400);
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

      // Browsers send the real filename (often with spaces, parentheses, …).
      // Sanitize it into a safe stored name instead of rejecting the upload.
      const filename = sanitizeFilename(
        queryFilename ?? headerFilename ?? dispositionFilename,
      );

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

/**
 * Turns a browser-supplied filename into a safe stored name.
 *
 * Real-world files are called things like `SLA Report (Aug).csv` — the old
 * Joi pattern rejected anything outside `[A-Za-z0-9._-]`, so everyday
 * uploads failed with a 422. Now we strip directory components, trim,
 * replace unsafe characters with `_`, and let Joi enforce the remaining
 * rules (must end in .csv, max 255 chars). Returns undefined when there is
 * nothing usable, so "filename is required" still fires.
 */
export function sanitizeFilename(input: string | undefined): string | undefined {
  if (input === undefined) {
    return undefined;
  }
  const base = input.split(/[\\/]/).pop() ?? "";
  const trimmed = base.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/[^a-zA-Z0-9._\- ]/g, "_");
}