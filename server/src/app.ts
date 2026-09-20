import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";

import { createDatasetRouter } from "./routes/dataset.routes.js";
import { createReportingRouter } from "./routes/reporting.routes.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import {
  authController,
  authMiddleware,
  datasetController,
  dashboardController,
  loginLimiter,
  registerLimiter,
} from "./container.js";
import { requestId } from "./middlewares/requestId.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/apiResponse.js";
import { checkDatabaseReady, checkSchemaReady } from "./db/pool.js";
import logger from "./middlewares/logger.js";
import env from "./config/env.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: { write: (message: string) => logger.info(message.trim()) },
    // Health probes poll often; keep them out of the access logs.
    skip: (req) => req.path === "/health",
  }));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        // The frontend calls this API cross-origin in split deployments;
        // allow-list the configured web origins or CSP blocks every fetch.
        connectSrc: ["'self'", ...env.CORS_ORIGIN],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }));
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      // Browsers send the origin without a trailing slash; normalize both
      // sides so "https://app.vercel.app/" in env still matches.
      const normalized = origin.trim().replace(/\/+$/, "");
      if (env.CORS_ORIGIN.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Filename"],
    exposedHeaders: ["X-Request-Id"],
    // Cache preflight responses for 24h: repeat API calls skip the OPTIONS
    // round-trip entirely.
    maxAge: 86400,
  }));
  app.use(compression({ level: 6, threshold: 1024 }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Cache-Control for GET endpoints (imported data is immutable)
  app.use("/api/v1/datasets", (req, res, next) => {
    if (req.method === "GET") {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    }
    next();
  });
  app.use("/api/v1/reporting", (req, res, next) => {
    if (req.method === "GET") {
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    }
    next();
  });

  app.get("/", (_req, res) => {
    sendSuccess(res, {
      statusCode: 200,
      message: "SLA CSV monitoring API",
      data: { environment: env.NODE_ENV },
    });
  });

  // Liveness + dependency probe. Never 500s on auth/upload again without an
  // obvious cause: if `db` is not "up", run `npm run migrate` and restart.
  app.get("/health", async (_req, res) => {
    try {
      await checkDatabaseReady();
      await checkSchemaReady();
      sendSuccess(res, {
        statusCode: 200,
        message: "OK",
        data: { db: "up", schema: "ready", environment: env.NODE_ENV },
      });
    } catch (err) {
      sendSuccess(res, {
        statusCode: 200,
        message: "Degraded",
        data: {
          db: "down",
          schema: "unknown",
          environment: env.NODE_ENV,
          hint: "Check DATABASE_URL and run 'npm run migrate'.",
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  });

  app.use("/api/v1/auth", createAuthRouter(authController, {
    registerLimiter,
    loginLimiter,
  }, authMiddleware));
  app.use("/api/v1/datasets", createDatasetRouter(datasetController, authMiddleware));
  app.use("/api/v1/reporting", createReportingRouter(dashboardController, authMiddleware));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}