import morgan from "morgan";
import logger from "../utils/logger.js";

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

const requestLogger = morgan(format, {
  stream: logger.stream,
  skip: (req) => req.url === "/health",
});

export default requestLogger;
