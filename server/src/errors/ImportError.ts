export class ImportError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ImportError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
