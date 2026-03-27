import Redis from 'ioredis';

let redis: Redis | null = null;

export function getAdminRedis(): Redis {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            connectTimeout: 5000,
            commandTimeout: 5000,
            maxRetriesPerRequest: 1,
        });
        redis.on('error', (err) => {
            console.error('Admin Redis error:', err);
        });
    }
    return redis;
}
