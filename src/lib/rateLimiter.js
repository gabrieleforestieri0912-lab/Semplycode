import Redis from 'ioredis';

// Simple Redis-backed rate limiter with in-memory Map fallback when REDIS_URL is not configured.
// API: limiter.once(key, windowMs, max) -> { allowed: boolean, remaining: number, reset: number }

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (e) => console.error('Redis error:', e));
}

const localMap = new Map();

export async function once(key, windowMs, max) {
  const now = Date.now();
  if (redisClient) {
    try {
      // Use a Redis key with TTL and INCR
      const redisKey = `rl:${key}`;
      const ttlSeconds = Math.ceil(windowMs / 1000);
      const count = await redisClient.incr(redisKey);
      if (count === 1) {
        await redisClient.expire(redisKey, ttlSeconds);
      }
      const ttl = await redisClient.ttl(redisKey);
      const allowed = count <= max;
      return { allowed, remaining: Math.max(0, max - count), reset: now + ttl * 1000 };
    } catch (err) {
      console.error('Redis limiter failed, falling back to in-memory:', err);
      // fall through to in-memory
    }
  }

  // In-memory fallback
  const rec = localMap.get(key) || { count: 0, reset: now + windowMs };
  if (now > rec.reset) {
    rec.count = 1;
    rec.reset = now + windowMs;
  } else {
    rec.count += 1;
  }
  localMap.set(key, rec);
  const allowed = rec.count <= max;
  return { allowed, remaining: Math.max(0, max - rec.count), reset: rec.reset };
}
