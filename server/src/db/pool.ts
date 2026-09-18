import pg from "pg";

import env from "../config/env.js";

function buildPoolConfig() {
  const config: pg.PoolConfig = {
    connectionString: env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };

  // Enforce SSL in production. In development, allow non-SSL for local dev.
  // This is programmatic enforcement — even if DATABASE_URL lacks sslmode,
  // we require SSL in production.
  if (env.NODE_ENV === "production") {
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

const pool = new pg.Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export default pool;

export async function checkDatabaseReady(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

const REQUIRED_TABLES = [
  "users",
  "refresh_tokens",
  "datasets",
  "observations",
  "slots",
  "data_quality_issues",
] as const;

/**
 * Fail-fast schema guard: a bare `SELECT 1` succeeds even when no tables
 * exist (exactly the state that used to produce cryptic 500s on every auth
 * and upload call). This names the missing tables and tells the operator to
 * run `npm run migrate`.
 */
export async function checkSchemaReady(): Promise<void> {
  const result = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)`,
    [Array.from(REQUIRED_TABLES)],
  );
  const present = new Set(result.rows.map((r) => r.tablename));
  const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
  if (missing.length > 0) {
    throw new Error(
      `Database schema is incomplete — missing table(s): ${missing.join(", ")}. Run 'npm run migrate' against DATABASE_URL, then restart.`,
    );
  }
}