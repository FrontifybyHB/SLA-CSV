import dotenv from "dotenv";

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, value: string | undefined, fallback: string): string {
  return value ?? fallback;
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return ["http://localhost:5173", "http://localhost:5174"];
  }
  const origins = value.split(",").map(normalizeOrigin).filter(Boolean);
  return origins.length > 0 ? [...new Set(origins)] : ["http://localhost:5173", "http://localhost:5174"];
}

function parseSameSite(value: string | undefined, isProduction: boolean): "lax" | "none" | "strict" {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "none" || normalized === "lax" || normalized === "strict") {
    return normalized;
  }
  // Cross-origin production deployments (Vercel frontend -> separate API
  // origin) need SameSite=None + Secure or the browser drops the session
  // cookies entirely. Same-origin keeps lax for CSRF safety.
  return isProduction ? "none" : "lax";
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

function strongSecret(name: string, value: string | undefined): string {
  const secret = required(name, value);
  if (isProduction) {
    // HS256 tokens are only as strong as the secret: reject short,
    // low-entropy, or placeholder values instead of booting forgeable.
    if (secret.length < 32 || /change-me/i.test(secret)) {
      throw new Error(
        `Environment variable ${name} must be at least 32 characters and not a placeholder in production`,
      );
    }
  }
  return secret;
}

const env = {
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required(
    "DATABASE_URL",
    process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/sla_csv"
  ),
  CORS_ORIGIN: parseCorsOrigins(process.env.CORS_ORIGIN),
  ACCESS_TOKEN_SECRET: strongSecret("ACCESS_TOKEN_SECRET", process.env.ACCESS_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: strongSecret("REFRESH_TOKEN_SECRET", process.env.REFRESH_TOKEN_SECRET),
  // Pepper for HMAC-based refresh token hashing (defense against DB leak + offline brute-force).
  // A public default in production would let anyone with a DB dump brute-force
  // tokens offline, so production refuses to boot without an explicit value.
  REFRESH_TOKEN_PEPPER: (() => {
    const pepper = optional(
      "REFRESH_TOKEN_PEPPER",
      process.env.REFRESH_TOKEN_PEPPER,
      "dev-pepper-change-in-production",
    );
    if (isProduction && pepper === "dev-pepper-change-in-production") {
      throw new Error(
        "Environment variable REFRESH_TOKEN_PEPPER must be set to a unique random value in production",
      );
    }
    return pepper;
  })(),
  COOKIE_SAME_SITE: parseSameSite(process.env.COOKIE_SAME_SITE, nodeEnv === "production"),
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? "").trim().toLowerCase() === "true"
    ? true
    : (process.env.COOKIE_SECURE ?? "").trim().toLowerCase() === "false"
      ? false
      : nodeEnv === "production" || parseSameSite(process.env.COOKIE_SAME_SITE, nodeEnv === "production") === "none",
};

export default env;