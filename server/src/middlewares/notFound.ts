import type { NextFunction, Request, Response } from "express";

import { AppError } from "./appError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, "NOT_FOUND"));
}