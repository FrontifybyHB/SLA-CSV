import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Schema, ValidationErrorItem } from "joi";

import { ValidationError } from "./appError.js";

type Source = "body" | "query" | "params";

export function toFields(details: ValidationErrorItem[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const detail of details) {
    const path = detail.path.join(".");
    if (!fields[path]) {
      fields[path] = detail.message;
    }
  }
  return fields;
}

export function validate(
  schema: Schema,
  source: Source = "body",
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      next(new ValidationError(toFields(error.details), "Validation failed"));
      return;
    }

    req.validated = { ...req.validated, [source]: value };
    next();
  };
}