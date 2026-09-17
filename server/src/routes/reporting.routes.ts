import express from "express";

import type { DashboardController } from "../controllers/dashboardController.js";
import type { AuthMiddleware } from "../middlewares/authMiddleware.js";
import {
  logsQuerySchema,
  slotsQuerySchema,
  statsQuerySchema,
} from "../validators/request.validator.js";
import { validate } from "../middlewares/validate.js";

export function createReportingRouter(
  controller: DashboardController,
  auth: AuthMiddleware,
): express.Router {
  const router = express.Router();

  router.get(
    "/stats",
    auth.requireAuth(),
    validate(statsQuerySchema, "query"),
    controller.stats,
  );

  router.get(
    "/logs",
    auth.requireAuth(),
    validate(logsQuerySchema, "query"),
    controller.logs,
  );

  router.get(
    "/slots",
    auth.requireAuth(),
    validate(slotsQuerySchema, "query"),
    controller.slots,
  );

  return router;
}