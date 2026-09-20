import type { NextFunction, Request, Response } from "express";

import env from "../config/env.js";
import { AppError } from "./appError.js";

/**
 * Origin check for cookie-authenticated state changes.
 *
 * Required when cookies are `SameSite=None` (cross-origin production): the
 * browser sends them on cross-site requests, so a malicious site could
 * otherwise drive POST /datasets, /auth/refresh or /auth/logout with the
 * victim's session. Browsers attach Origin (or Referer as fallback) on
 * writes — a mismatch means a cross-site request and is rejected with 403.
 *
 * Requests with neither header (curl, mobile apps, server-to-server) are
 * allowed through; they carry no ambient browser authority.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const origin = firstHeader(req.headers.origin);
  const referer = firstHeader(req.headers.referer);
  const candidate = origin ?? referer;
  if (!candidate) {
    next();
    return;
  }

  let candidateOrigin: string;
  try {
    candidateOrigin = new URL(candidate).origin;
  } catch {
    next(new AppError("Invalid Origin header", 403, "FORBIDDEN"));
    return;
  }

  const host = req.get("host");
  const sameOrigin = host ? `${req.protocol}://${host}` : null;
  const allowed = new Set(env.CORS_ORIGIN);
  if (sameOrigin) {
    allowed.add(sameOrigin);
  }

  if (!allowed.has(candidateOrigin)) {
    next(new AppError("Cross-site request rejected", 403, "FORBIDDEN"));
    return;
  }

  next();
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
