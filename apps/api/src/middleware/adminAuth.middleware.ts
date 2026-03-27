import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { getAdminRedis } from '../db/adminRedis';

export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!env.ADMIN_SECRET_HASH) {
        res.status(503).json({ error: 'Admin dashboard not configured' });
        return;
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ error: 'Missing admin session token' });
        return;
    }

    try {
        const redis = getAdminRedis();
        const exists = await redis.exists(`admin_session:${token}`);
        if (!exists) {
            res.status(401).json({ error: 'Invalid or expired session' });
            return;
        }
    } catch (err) {
        console.error('Admin auth Redis error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }

    next();
}
