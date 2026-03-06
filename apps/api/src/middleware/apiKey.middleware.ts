import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { pool } from '../db/postgres';
import { ApiKeyRecord } from '../types/vault.types';

export async function apiKeyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
        res.status(401).json({
            error: 'Missing API key. Provide a valid key in the x-api-key header.',
            statusCode: 401,
        });
        return;
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    let record: ApiKeyRecord;
    try {
        const result = await pool.query<ApiKeyRecord>(
            'SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true',
            [keyHash],
        );

        if (result.rows.length === 0) {
            res.status(401).json({
                error: 'Invalid or inactive API key.',
                statusCode: 401,
            });
            return;
        }

        record = result.rows[0];
    } catch (err) {
        console.error('apiKeyMiddleware DB error:', err);
        res.status(500).json({ error: 'Internal server error', statusCode: 500 });
        return;
    }

    // Attach to request for downstream middleware (rate limiter reads tier here)
    req.apiKey = record;

    // Fire-and-forget usage tracking — never block the request path
    pool.query(
        'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = $1',
        [record.id],
    ).catch((err) => console.error('Usage tracking failed:', err));

    next();
}
