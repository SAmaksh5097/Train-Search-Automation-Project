import "dotenv/config";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { sessionIdSchema } from "./validation.js";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is required for API rate limiting.");
}

function getPositiveInteger(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10_000,
});

redis.on("error", (error) => {
  console.error("Rate limiter Redis error:", {
    code: error.code,
    message: error.message,
  });
});

function createLimiter(name, environmentVariable, defaultPoints) {
  const points = getPositiveInteger(environmentVariable, defaultPoints);
  const duration = getPositiveInteger("RATE_LIMIT_WINDOW_SECONDS", 60);

  return {
    points,
    limiter: new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: `rate-limit:${name.toLowerCase()}`,
      points,
      duration,
    }),
  };
}

const limiters = {
  chat: createLimiter("CHAT", "CHAT_LIMIT", 15),
  search: createLimiter("SEARCH", "SEARCH_LIMIT", 5),
};

function getSessionId(req) {
  const sessionId = req.body?.sessionId;

  if (!sessionIdSchema.safeParse(sessionId).success) {
    return null;
  }

  return sessionId;
}

export function rateLimit(name) {
  const config = limiters[name];

  if (!config) {
    throw new Error(`Unknown rate limiter: ${name}`);
  }

  return async (req, res, next) => {
    const sessionId = getSessionId(req);

    if (!sessionId) {
      return res.status(400).json({
        error: "A valid sessionId is required.",
      });
    }

    const key = `${req.ip}:${sessionId}`;

    try {
      const result = await config.limiter.consume(key);
      res.set("RateLimit-Limit", String(config.points));
      res.set("RateLimit-Remaining", String(result.remainingPoints));
      return next();
    } catch (error) {
      if (typeof error?.msBeforeNext === "number") {
        const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
        res.set("Retry-After", String(retryAfter));
        res.set("RateLimit-Limit", String(config.points));
        res.set("RateLimit-Remaining", "0");

        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter,
        });
      }

      console.error("Rate limiter failed:", error);
      return res.status(503).json({
        error: "Request limiting is temporarily unavailable.",
      });
    }
  };
}
