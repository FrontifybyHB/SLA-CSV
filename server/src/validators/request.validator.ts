import Joi from "joi";

const FILENAME_PATTERN = /^[a-zA-Z0-9._-]+\.(csv)$/i;

export const uploadRequestSchema = Joi.object({
  filename: Joi.string()
    .pattern(FILENAME_PATTERN)
    .max(255)
    .required()
    .messages({
      "string.pattern.base":
        "Filename must end in .csv and contain only letters, numbers, dots, dashes, or underscores",
      "any.required": "A filename is required (use ?filename= or x-filename header)",
    }),
  contentType: Joi.string()
    .valid(
      "text/csv",
      "application/csv",
      "text/plain",
      "application/vnd.ms-excel",
    )
    .required()
    .messages({
      "any.only": "Unsupported content type; expected a CSV file",
      "any.required": "Content-Type header is required",
    }),
  size: Joi.number()
    .integer()
    .positive()
    .max(5 * 1024 * 1024)
    .required()
    .messages({
      "number.max": "CSV file exceeds the 5 MB upload limit",
      "number.base": "Request body must be raw CSV bytes",
    }),
});

export const statsQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  datasetId: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.array().items(Joi.string().uuid()),
  ).optional(),
}).messages({
  "date.iso": "Dates must be ISO 8601 (e.g. 2026-09-17)",
  "any.required": "startDate and endDate query parameters are required",
});

export const logsQuerySchema = statsQuerySchema.keys({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(500).default(50),
});

export const slotsQuerySchema = logsQuerySchema;