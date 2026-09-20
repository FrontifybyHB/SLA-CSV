/* eslint-disable @typescript-eslint/no-namespace */
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      file?: {
        bytes: Buffer;
        filename: string;
      };
      validated?: Record<string, unknown>;
    }
  }
}

// Only accept safe client-supplied ids: anything else (newlines, ANSI
// escapes, over-long values) would be reflected into logs and the
// X-Request-Id response header.
const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && SAFE_REQUEST_ID_PATTERN.test(incoming)
      ? incoming
      : randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}