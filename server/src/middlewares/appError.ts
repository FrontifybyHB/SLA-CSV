export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code = "UNAUTHORIZED", statusCode = 401) {
    super(message, statusCode, code);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends AppError {
  fields: Record<string, string>;

  constructor(fields: Record<string, string>, message = "Validation failed") {
    super(message, 422);
    this.name = "ValidationError";
    this.fields = fields;
  }
}