import express from "express";

import type { AuthController } from "../controllers/authController.js";
import type { AuthMiddleware } from "../middlewares/authMiddleware.js";
import type { InMemoryRateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator.js";

export interface AuthRateLimiters {
  registerLimiter: InMemoryRateLimiter;
  loginLimiter: InMemoryRateLimiter;
}

export function createAuthRouter(
  controller: AuthController,
  limiters: AuthRateLimiters,
  auth: AuthMiddleware,
): express.Router {
  const router = express.Router();

  router.get("/me", auth.requireAuth(), controller.me);

  router.post(
    "/register",
    limiters.registerLimiter.middleware(),
    validate(registerSchema),
    controller.register,
  );

  router.post(
    "/login",
    limiters.loginLimiter.middleware(),
    validate(loginSchema),
    controller.login,
  );

  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);

  return router;
}