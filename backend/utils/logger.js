import { createLogger, format, transports } from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors } = format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  }),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), format.json());

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    new transports.Console({ format: consoleFormat }),
    ...(process.env.NODE_ENV === "production"
      ? [
          new transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
            format: fileFormat,
          }),
          new transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
            format: fileFormat,
          }),
        ]
      : []),
  ],
});

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

logger.logEvent = (level, event, meta = {}) => {
  logger.log(level, event, meta);
};

export default logger;
