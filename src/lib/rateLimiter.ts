import Redis from 'ioredis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  count?: number;
}

interface LocalRecord {
  count: number;
  reset: number;
}

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (e: Error) => console.error('Redis error:', e));
}

const localMap = new Map<string, LocalRecord>();

export async function once(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
  const now = Date.now();
  if (redisClient) {
    try {
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
    }
  }

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

export async function peek(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
  const now = Date.now();
  if (redisClient) {
    try {
      const redisKey = `rl:${key}`;
      const raw = await redisClient.get(redisKey);
      const count = raw ? parseInt(raw, 10) : 0;
      const ttl = await redisClient.ttl(redisKey);
      const reset = ttl > 0 ? now + ttl * 1000 : now + windowMs;
      return {
        allowed: count < max,
        remaining: Math.max(0, max - count),
        reset,
        count,
      };
    } catch (err) {
      console.error('Redis peek failed:', err);
    }
  }

  const rec = localMap.get(key) || { count: 0, reset: now + windowMs };
  if (now > rec.reset) {
    return { allowed: true, remaining: max, reset: now + windowMs, count: 0 };
  }
  return {
    allowed: rec.count < max,
    remaining: Math.max(0, max - rec.count),
    reset: rec.reset,
    count: rec.count,
  };
}
