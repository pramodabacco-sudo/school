// server/src/utils/redis.js
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

let redisClient = null;

export const isRedisReady = () =>
  redisClient && redisClient.isOpen && redisClient.isReady;

if (redisUrl) {
  const isTLS = redisUrl.startsWith("rediss://"); // ✅ detect automatically

  redisClient = createClient({
    url: redisUrl,

    socket: {
      ...(isTLS && {
        tls: true,
        rejectUnauthorized: false,
      }),

      reconnectStrategy(retries) {
        if (retries > 10) {
          console.error("❌ Redis reconnect failed");
          return new Error("Retry attempts exhausted");
        }
        return Math.min(retries * 200, 3000);
      },
    },
  });

  redisClient.on("connect", () => {
    console.log("🟡 Redis connecting...");
  });

  redisClient.on("ready", () => {
    console.log("🟢 Redis Connected ✅");
  });

  redisClient.on("error", (err) => {
    console.error("🔴 Redis Error:", err.message);
  });

  redisClient.on("end", () => {
    console.warn("⚠️ Redis connection closed");
  });

  redisClient.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
  });

  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error("❌ Redis connection failed:", err.message);
    }
  })();
} else {
  console.warn("⚠️ REDIS_URL not set. Redis disabled.");
}

export default redisClient;