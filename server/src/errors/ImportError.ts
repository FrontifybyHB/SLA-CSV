import { AppError } from "../middlewares/appError.js";

/**
 * A CSV import failure caused by the file's contents (empty file, missing
 * required headers, zero normalizable rows). These are client errors (422),
 * not server crashes — the handler must return the message, not a 500.
 */
export class ImportError extends AppError {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message, 422, code);
    this.name = "ImportError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
