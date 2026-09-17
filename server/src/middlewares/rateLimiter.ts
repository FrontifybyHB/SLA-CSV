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

// Minimal in-memory fixed-window limiter. Fine for a single instance; replace with a
// shared store (Redis) if multiple server processes run behind a load balancer.
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
      const key = req.ip ?? "unknown";
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