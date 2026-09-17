import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import pool from "./pool.js";

const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
const migrationsDir = fileURLToPath(new URL("./migrations", import.meta.url));

async function migrate(): Promise<void> {
  const sql = await readFile(schemaPath, "utf8");
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const client = await pool.connect();
  try {
    await client.query(sql);
    for (const file of migrationFiles) {
      const migrationSql = await readFile(join(migrationsDir, file), "utf8");
      await client.query(migrationSql);
      console.log(`Applied migration: ${file}`);
    }
    console.log("Database schema is ready.");
  } finally {
    client.release();
  }
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  });