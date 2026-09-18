import dotenv from "dotenv";

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return ["http://localhost:5173"];
  }
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function optional(name: string, value: string | undefined, fallback: string): string {
  return value ?? fallback;
}

const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required(
    "DATABASE_URL",
    process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/sla_csv"
  ),
  CORS_ORIGIN: parseCorsOrigins(process.env.CORS_ORIGIN),
  ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET", process.env.ACCESS_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET", process.env.REFRESH_TOKEN_SECRET),
  // Pepper for HMAC-based refresh token hashing (defense against DB leak + offline brute-force)
  // In production, must be set via env var. In development, use a default.
  REFRESH_TOKEN_PEPPER: optional(
    "REFRESH_TOKEN_PEPPER",
    process.env.REFRESH_TOKEN_PEPPER,
    "dev-pepper-change-in-production"
  ),
  // Frontend API base URL (used by client build)
  API_BASE_URL: optional(
    "API_BASE_URL",
    process.env.API_BASE_URL,
    "http://localhost:3000/api/v1"
  ),
};

export default env;