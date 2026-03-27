import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/postgres';

const SKIP_PREFIXES = ['/health', '/docs', '/dashboard', '/.well-known', '/openapi.json', '/llms.txt'];

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (SKIP_PREFIXES.some((p) => req.path.startsWith(p))) {
        next();
        return;
    }

    const start = Date.now();
    const originalEnd = res.end;

    res.end = function (this: Response, ...args: Parameters<Response['end']>) {
        const duration = Date.now() - start;

        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : req.originalUrl.split('?')[0];

        pool.query(
            `INSERT INTO request_logs
             (api_key_id, api_key_name, tier, method, path, route, status_code,
              response_time, user_agent, ip_address)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
                req.apiKey?.id ?? null,
                req.apiKey?.name ?? null,
                req.apiKey?.tier ?? null,
                req.method,
                req.originalUrl.substring(0, 512),
                route?.substring(0, 256) ?? null,
                res.statusCode,
                duration,
                (req.headers['user-agent'] ?? '').substring(0, 512),
                req.ip ?? null,
            ],
        ).catch((err) => console.error('Request log write failed:', err));

        return originalEnd.apply(this, args);
    } as typeof res.end;

    next();
}
