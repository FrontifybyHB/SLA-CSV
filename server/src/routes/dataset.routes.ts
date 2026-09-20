import express from "express";

import type { DatasetController } from "../controllers/datasetController.js";
import { requireFile, SUPPORTED_CONTENT_TYPES } from "../middlewares/fileUpload.js";
import type { AuthMiddleware } from "../middlewares/authMiddleware.js";
import type { InMemoryRateLimiter } from "../middlewares/rateLimiter.js";
import { csrfProtection } from "../middlewares/csrf.js";

export function createDatasetRouter(
  controller: DatasetController,
  auth: AuthMiddleware,
  uploadLimiter?: InMemoryRateLimiter,
): express.Router {
  const router = express.Router();

  router.post(
    "/",
    ...(uploadLimiter ? [uploadLimiter.middleware()] : []),
    auth.requireAuth(),
    csrfProtection,
    express.raw({
      type: SUPPORTED_CONTENT_TYPES,
      limit: "5mb",
    }),
    requireFile(),
    controller.upload,
  );

  router.get("/", auth.requireAuth(), controller.list);

  router.get("/:id", auth.requireAuth(), controller.detail);

  return router;
}