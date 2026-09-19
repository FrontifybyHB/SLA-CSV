import winston from "winston";

const { createLogger, format, transports } = winston;

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.colorize(),
  format.printf(({ timestamp, level, message, requestId }) => {
    const prefix = requestId ? ` [${requestId}]` : "";
    return `${timestamp} [${level}]${prefix}: ${message}`;
  })
);

const loggerTransports: winston.transport[] = [];
// Vercel serverless (and any production runtime) has a read-only filesystem
// except /tmp, so `logs/*.log` file writes crash the function with an
// unhandled winston 'error' event (surfaced as FUNCTION_INVOCATION_FAILED).
// Log to stdout there — Vercel captures it in the function logs.
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  loggerTransports.push(new transports.Console({ format: logFormat }));
} else {
  loggerTransports.push(
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
    new transports.Console({ format: logFormat }),
  );
}

const logger = createLogger({
  level: "info",
  format: logFormat,
  transports: loggerTransports,
});

export default logger;