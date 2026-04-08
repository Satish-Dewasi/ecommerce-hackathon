import Redis from "ioredis";
import logger from "./logger.js";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn("Redis unavailable — running without cache");
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
  tls: {},
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) =>
  logger.error("Redis error", { message: err.message }),
);

const DEFAULT_TTL = 60 * 5; // 5 minutes

// Get cached value — returns parsed object or null
export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    logger.debug(`Cache HIT: ${key}`);
    return JSON.parse(data);
  } catch (err) {
    logger.error("Cache GET failed", { key, message: err.message });
    return null; // fail silently — fall through to DB
  }
};

// Set cache with TTL
export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    logger.error("Cache SET failed", { key, message: err.message });
    // fail silently — app still works without cache
  }
};

// Delete one or more keys (used on update/delete)
export const invalidateCache = async (...keys) => {
  try {
    await redis.del(...keys);
    logger.debug(`Cache INVALIDATED: ${keys.join(", ")}`);
  } catch (err) {
    logger.error("Cache invalidation failed", { keys, message: err.message });
  }
};

export default redis;
