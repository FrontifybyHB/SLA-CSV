import { createApp } from "./src/app.js";
import { checkDatabaseReady, checkSchemaReady } from "./src/db/pool.js";
import env from "./src/config/env.js";
import logger from "./src/middlewares/logger.js";

const app = createApp();

async function start(): Promise<void> {
  await checkDatabaseReady();
  logger.info("Database connection is ready");

  await checkSchemaReady();
  logger.info("Database schema is ready");

  app.listen(env.PORT, () => {
    logger.info(`Server is running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server", { error: (err as Error).message });
  process.exit(1);
});