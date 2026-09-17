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

const logger = createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({ format: logFormat })
  );
}

export default logger;