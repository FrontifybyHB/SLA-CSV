import dotenv from "dotenv";

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required(
    "DATABASE_URL",
    process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/sla_csv"
  ),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET", process.env.ACCESS_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET", process.env.REFRESH_TOKEN_SECRET),
};

export default env;