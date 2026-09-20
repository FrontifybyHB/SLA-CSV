import express from "express";

import type { DashboardController } from "../controllers/dashboardController.js";
import type { AuthMiddleware } from "../middlewares/authMiddleware.js";
import {
  issuesQuerySchema,
  logsQuerySchema,
  slotsQuerySchema,
  statsQuerySchema,
} from "../validators/request.validator.js";
import { validate } from "../middlewares/validate.js";
import type { InMemoryRateLimiter } from "../middlewares/rateLimiter.js";

export function createReportingRouter(
  controller: DashboardController,
  auth: AuthMiddleware,
  reportingLimiter?: InMemoryRateLimiter,
): express.Router {
  const router = express.Router();
  const throttle = reportingLimiter ? [reportingLimiter.middleware()] : [];

  router.get(
    "/stats",
    ...throttle,
    auth.requireAuth(),
    validate(statsQuerySchema, "query"),
    controller.stats,
  );

  router.get(
    "/logs",
    ...throttle,
    auth.requireAuth(),
    validate(logsQuerySchema, "query"),
    controller.logs,
  );

  router.get(
    "/slots",
    ...throttle,
    auth.requireAuth(),
    validate(slotsQuerySchema, "query"),
    controller.slots,
  );

  router.get(
    "/issues",
    ...throttle,
    auth.requireAuth(),
    validate(issuesQuerySchema, "query"),
    controller.issues,
  );

  return router;
}