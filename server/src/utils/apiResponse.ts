import type { Response } from "express";

export interface ApiSuccessOptions {
  statusCode: number;
  message: string;
  data?: unknown;
}

export interface ApiErrorOptions extends ApiSuccessOptions {
  code?: string;
  requestId?: string;
  errors?: Record<string, string>;
  stack?: string;
}

export function sendSuccess(res: Response, options: ApiSuccessOptions): Response {
  const body: Record<string, unknown> = {
    success: true,
    statusCode: options.statusCode,
    message: options.message,
  };
  if (options.data !== undefined) {
    body.data = options.data;
  }
  return res.status(options.statusCode).json(body);
}

export function sendError(res: Response, options: ApiErrorOptions): Response {
  const body: Record<string, unknown> = {
    success: false,
    statusCode: options.statusCode,
    message: options.message,
  };
  if (options.code !== undefined) {
    body.code = options.code;
  }
  if (options.requestId !== undefined) {
    body.requestId = options.requestId;
  }
  if (options.errors !== undefined) {
    body.errors = options.errors;
  }
  if (options.stack !== undefined) {
    body.stack = options.stack;
  }
  if (options.data !== undefined) {
    body.data = options.data;
  }
  return res.status(options.statusCode).json(body);
}