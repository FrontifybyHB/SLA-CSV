export class ExpiredTokenError extends Error {
  constructor(message = "Access token expired") {
    super(message);
    this.name = "ExpiredTokenError";
  }
}

export class InvalidTokenError extends Error {
  constructor(message = "Invalid token") {
    super(message);
    this.name = "InvalidTokenError";
  }
}