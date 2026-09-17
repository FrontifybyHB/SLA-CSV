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

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers["x-request-id"];
  const id = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}