import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            lazyConnect: true,
            enableOfflineQueue: false,
        });
        redis.on('error', (err) => {
            console.error('Redis error:', err);
        });
    }
    return redis;
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 *
 * Algorithm:
 *   1. Remove entries older than (now - 60s) from the sorted set
 *   2. Add the current timestamp as a new entry
 *   3. Count total entries in the window
 *   4. Set expiry on the key
 *
 * Fails open: if Redis is unavailable, the request is allowed through
 * rather than causing a service outage.
 *
 * Must run after apiKeyMiddleware (reads req.apiKey).
 */
export async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const apiKey = req.apiKey!;
    const limit = apiKey.rate_limit_per_minute;
    const windowMs = 60_000;
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `rate:${apiKey.id}`;

    try {
        const client = getRedis();
        const pipeline = client.pipeline();

        // Remove entries outside the current window
        pipeline.zremrangebyscore(redisKey, 0, windowStart);
        // Add the current request (unique member: timestamp + random suffix)
        pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
        // Count requests in the window
        pipeline.zcard(redisKey);
        // Expire the key after the window (cleanup)
        pipeline.expire(redisKey, 60);

        const results = await pipeline.exec();
        const count = (results?.[2]?.[1] as number) ?? 0;
        const remaining = Math.max(0, limit - count);
        const resetAt = Math.ceil((now + windowMs) / 1000);

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetAt);

        if (count > limit) {
            res.status(429).json({
                error: 'Rate limit exceeded. See X-RateLimit-Reset for when your limit resets.',
                statusCode: 429,
                retryAfter: 60,
            });
            return;
        }
    } catch (err) {
        // Fail open — log but don't block the request
        console.error('Rate limit Redis error (fail-open):', err);
    }

    next();
}
