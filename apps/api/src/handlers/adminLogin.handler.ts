import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { getAdminRedis } from '../db/adminRedis';

export async function adminLogin(req: Request, res: Response): Promise<void> {
    if (!env.ADMIN_SECRET_HASH) {
        res.status(503).json({ error: 'Admin dashboard not configured' });
        return;
    }

    const { password } = req.body as { password?: string };
    if (!password || typeof password !== 'string') {
        res.status(400).json({ error: 'Password is required' });
        return;
    }

    // Hash the incoming password and compare to the stored hash
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(env.ADMIN_SECRET_HASH))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    // Issue a random session token stored in Redis with TTL
    try {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const redis = getAdminRedis();
        await redis.set(`admin_session:${sessionToken}`, '1', 'EX', env.ADMIN_SESSION_TTL);
        res.json({ token: sessionToken, expiresIn: env.ADMIN_SESSION_TTL });
    } catch (err) {
        console.error('Failed to create admin session:', err);
        res.status(500).json({ error: 'Failed to create session — check Redis connection' });
    }
}
