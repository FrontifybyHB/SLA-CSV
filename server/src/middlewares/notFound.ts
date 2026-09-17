import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  (err as Error & { statusCode: number }).statusCode = 404;
  next(err);
}