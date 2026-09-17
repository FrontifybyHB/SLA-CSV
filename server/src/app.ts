import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

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
import logger from "./middlewares/logger.js";
import env from "./config/env.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(morgan("dev", {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    sendSuccess(res, {
      statusCode: 200,
      message: "SLA CSV monitoring API",
      data: { environment: env.NODE_ENV },
    });
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