import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "./appError.js";

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

function getClientIp(req: Request): string {
  // When behind a trusted proxy (app.set('trust proxy', 1)), req.ip is safe.
  // For direct connections or untrusted proxies, use socket.remoteAddress.
  // NEVER trust X-Forwarded-For directly — attackers control it.
  if (req.ip && req.ip !== "::1" && req.ip !== "127.0.0.1" && req.ip !== "unknown") {
    return req.ip;
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly sweepTimer: NodeJS.Timeout;

  constructor(private readonly options: RateLimiterOptions) {
    this.sweepTimer = setInterval(
      () => this.sweep(),
      Math.max(options.windowMs, 60_000),
    );
    this.sweepTimer.unref();
  }

  middleware(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const key = getClientIp(req);
      const now = Date.now();
      const bucket = this.buckets.get(key);

      if (!bucket || bucket.resetAt <= now) {
        this.buckets.set(key, { count: 1, resetAt: now + this.options.windowMs });
        next();
        return;
      }

      bucket.count += 1;
      if (bucket.count > this.options.max) {
        next(new AppError("Too many requests, please try again later", 429));
        return;
      }

      next();
    };
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}