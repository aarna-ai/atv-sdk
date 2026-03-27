import crypto from 'crypto';
import { Request, Response } from 'express';
import { pool } from '../db/postgres';
import { env } from '../config/env';
import { Tier, TIER_RATE_LIMITS } from '../types/vault.types';

const NPM_PACKAGE = '@aarna-ai/mcp-server-atv';
const NPM_BASE = 'https://api.npmjs.org/downloads';

export async function getNpmDownloads(_req: Request, res: Response): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const pkg = encodeURIComponent(NPM_PACKAGE);

    const [rangeRes, monthlyRes, weeklyRes] = await Promise.all([
        fetch(`${NPM_BASE}/range/2000-01-01:${today}/${pkg}`),
        fetch(`${NPM_BASE}/point/last-month/${pkg}`),
        fetch(`${NPM_BASE}/point/last-week/${pkg}`),
    ]);

    if (!rangeRes.ok || !monthlyRes.ok || !weeklyRes.ok) {
        res.status(502).json({ error: 'npm registry request failed' });
        return;
    }

    const [rangeData, monthlyData, weeklyData] = await Promise.all([
        rangeRes.json() as Promise<{ downloads: { downloads: number; day: string }[] }>,
        monthlyRes.json() as Promise<{ downloads: number }>,
        weeklyRes.json() as Promise<{ downloads: number }>,
    ]);

    const allDownloads = rangeData.downloads ?? [];
    const total = allDownloads.reduce((sum: number, d: { downloads: number }) => sum + d.downloads, 0);
    const trend = allDownloads.slice(-30);

    res.json({
        total,
        monthly: monthlyData.downloads ?? 0,
        weekly: weeklyData.downloads ?? 0,
        trend,
    });
}

const VALID_PERIODS: Record<string, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
};

function getInterval(req: Request): string {
    const period = (req.query.period as string) || '24h';
    return VALID_PERIODS[period] ?? VALID_PERIODS['24h'];
}

function getGranularity(req: Request): string {
    const period = (req.query.period as string) || '24h';
    return period === '24h' ? 'hour' : 'day';
}

export async function getOverview(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const [logsResult, keysResult] = await Promise.all([
        pool.query(
            `SELECT
                COUNT(*)::int                                           AS total_requests,
                COUNT(DISTINCT api_key_id)::int                        AS active_keys,
                COUNT(*) FILTER (WHERE status_code >= 400)::int        AS error_count,
                ROUND(AVG(response_time))::int                         AS avg_response_time_ms
             FROM request_logs
             WHERE created_at >= NOW() - $1::interval`,
            [interval],
        ),
        pool.query(
            `SELECT COUNT(*)::int AS total_keys FROM api_keys WHERE is_active = true`,
        ),
    ]);
    res.json({
        ...logsResult.rows[0],
        total_keys: keysResult.rows[0].total_keys,
    });
}

export async function getRequestsOverTime(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const granularity = getGranularity(req);
    const result = await pool.query(
        `SELECT
            date_trunc($2, created_at)                              AS bucket,
            COUNT(*)::int                                           AS count,
            COUNT(*) FILTER (WHERE status_code >= 400)::int         AS error_count
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval
         GROUP BY bucket
         ORDER BY bucket`,
        [interval, granularity],
    );
    res.json(result.rows);
}

export async function getTopEndpoints(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await pool.query(
        `SELECT
            route,
            COUNT(*)::int                                           AS count,
            ROUND(AVG(response_time))::int                         AS avg_response_time_ms,
            ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 400)
                / NULLIF(COUNT(*), 0), 2)                          AS error_rate
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval AND route IS NOT NULL
         GROUP BY route
         ORDER BY count DESC
         LIMIT $2`,
        [interval, limit],
    );
    res.json(result.rows);
}

export async function getApiKeys(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            rl.api_key_id,
            rl.api_key_name,
            rl.tier,
            COUNT(*)::int                                           AS request_count,
            COUNT(*) FILTER (WHERE rl.status_code >= 400)::int      AS error_count,
            ROUND(AVG(rl.response_time))::int                      AS avg_response_time_ms,
            MAX(rl.created_at)                                     AS last_request_at
         FROM request_logs rl
         WHERE rl.created_at >= NOW() - $1::interval AND rl.api_key_id IS NOT NULL
         GROUP BY rl.api_key_id, rl.api_key_name, rl.tier
         ORDER BY request_count DESC`,
        [interval],
    );
    res.json(result.rows);
}

export async function getErrors(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            status_code,
            route,
            COUNT(*)::int AS count
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval AND status_code >= 400
         GROUP BY status_code, route
         ORDER BY count DESC
         LIMIT 50`,
        [interval],
    );
    res.json(result.rows);
}

export async function getLatency(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            route,
            ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY response_time))::int AS p50,
            ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time))::int AS p95,
            ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY response_time))::int AS p99,
            COUNT(*)::int AS sample_count
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval AND route IS NOT NULL
         GROUP BY route
         ORDER BY p95 DESC`,
        [interval],
    );
    res.json(result.rows);
}

export async function runCleanup(_req: Request, res: Response): Promise<void> {
    const result = await pool.query(
        'DELETE FROM request_logs WHERE created_at < NOW() - make_interval(days => $1)',
        [env.LOG_RETENTION_DAYS],
    );
    res.json({ deleted: result.rowCount ?? 0 });
}

export async function listAllApiKeys(_req: Request, res: Response): Promise<void> {
    const result = await pool.query(
        `SELECT
            ak.id,
            ak.name,
            ak.key_prefix,
            ak.tier,
            ak.rate_limit_per_minute,
            ak.is_active,
            ak.usage_count::int AS usage_count,
            ak.created_at,
            ak.last_used_at
         FROM api_keys ak
         ORDER BY ak.created_at DESC`,
    );
    res.json(result.rows);
}

export async function createApiKey(req: Request, res: Response): Promise<void> {
    const { name, tier } = req.body as { name?: string; tier?: string };

    if (!name || !name.trim()) {
        res.status(400).json({ error: 'name is required' });
        return;
    }

    const validTier = (tier ?? 'free') as Tier;
    if (!['free', 'pro', 'enterprise'].includes(validTier)) {
        res.status(400).json({ error: 'Invalid tier. Use: free | pro | enterprise' });
        return;
    }

    const rawKey = `atv_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);
    const rateLimit = TIER_RATE_LIMITS[validTier];

    const result = await pool.query(
        `INSERT INTO api_keys (name, key_prefix, key_hash, tier, rate_limit_per_minute)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, key_prefix, tier, rate_limit_per_minute, is_active, created_at`,
        [name.trim(), keyPrefix, keyHash, validTier, rateLimit],
    );

    res.status(201).json({
        ...result.rows[0],
        raw_key: rawKey,
    });
}

export async function toggleApiKey(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await pool.query(
        `UPDATE api_keys SET is_active = NOT is_active WHERE id = $1
         RETURNING id, name, is_active`,
        [id],
    );
    if (result.rowCount === 0) {
        res.status(404).json({ error: 'API key not found' });
        return;
    }
    res.json(result.rows[0]);
}

export async function deleteApiKey(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM api_keys WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        res.status(404).json({ error: 'API key not found' });
        return;
    }
    res.json({ deleted: true });
}

export async function getStatusBreakdown(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            CASE
                WHEN status_code BETWEEN 200 AND 299 THEN '2xx'
                WHEN status_code BETWEEN 300 AND 399 THEN '3xx'
                WHEN status_code BETWEEN 400 AND 499 THEN '4xx'
                WHEN status_code >= 500 THEN '5xx'
            END AS status_group,
            COUNT(*)::int AS count
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval
         GROUP BY status_group
         ORDER BY status_group`,
        [interval],
    );
    res.json(result.rows);
}

export async function getUserAgentBreakdown(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            CASE
                WHEN user_agent ILIKE '%atv-sdk%' THEN 'ATV SDK'
                WHEN user_agent ILIKE '%axios%' THEN 'Axios'
                WHEN user_agent ILIKE '%node%' OR user_agent ILIKE '%node-fetch%' THEN 'Node.js'
                WHEN user_agent ILIKE '%python%' THEN 'Python'
                WHEN user_agent ILIKE '%curl%' THEN 'cURL'
                WHEN user_agent ILIKE '%postman%' THEN 'Postman'
                WHEN user_agent ILIKE '%mozilla%' OR user_agent ILIKE '%chrome%' OR user_agent ILIKE '%safari%' THEN 'Browser'
                WHEN user_agent IS NULL THEN 'Unknown'
                ELSE 'Other'
            END AS category,
            COUNT(*)::int AS count
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval
         GROUP BY category
         ORDER BY count DESC`,
        [interval],
    );
    res.json(result.rows);
}

export async function getRecentRequests(req: Request, res: Response): Promise<void> {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await pool.query(
        `SELECT
            rl.method,
            rl.path,
            rl.route,
            rl.status_code,
            rl.response_time,
            rl.api_key_name,
            rl.tier,
            rl.ip_address,
            rl.created_at
         FROM request_logs rl
         ORDER BY rl.created_at DESC
         LIMIT $1`,
        [limit],
    );
    res.json(result.rows);
}

export async function getTopVaults(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            substring(path FROM '/v1/vaults/(0x[a-fA-F0-9]+)') AS vault_address,
            COUNT(*)::int AS query_count,
            COUNT(DISTINCT api_key_id)::int AS unique_keys,
            COUNT(DISTINCT route)::int AS unique_endpoints,
            ROUND(AVG(response_time))::int AS avg_response_time_ms
         FROM request_logs
         WHERE path ~ '/v1/vaults/0x[a-fA-F0-9]+'
           AND created_at >= NOW() - $1::interval
         GROUP BY vault_address
         ORDER BY query_count DESC
         LIMIT 20`,
        [interval],
    );
    res.json(result.rows);
}

export async function getTxFunnel(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            CASE
                WHEN route ILIKE '%deposit-tx%' THEN 'Deposit'
                WHEN route ILIKE '%unqueue-withdraw%' THEN 'Unqueue Withdraw'
                WHEN route ILIKE '%redeem-withdraw%' THEN 'Redeem Withdraw'
                WHEN route ILIKE '%queue-withdraw%' THEN 'Queue Withdraw'
                WHEN route ILIKE '%withdraw-tx%' THEN 'Withdraw'
                WHEN route ILIKE '%unstake%' THEN 'Unstake'
                WHEN route ILIKE '%stake%' THEN 'Stake'
            END AS tx_type,
            COUNT(*)::int AS total_builds,
            COUNT(*) FILTER (WHERE status_code < 400)::int AS successful_builds,
            COUNT(*) FILTER (WHERE status_code >= 400)::int AS failed_builds,
            COUNT(DISTINCT api_key_id)::int AS unique_keys
         FROM request_logs
         WHERE (route ILIKE '%deposit-tx%'
            OR route ILIKE '%withdraw-tx%'
            OR route ILIKE '%stake%'
            OR route ILIKE '%unstake%'
            OR route ILIKE '%queue-withdraw%'
            OR route ILIKE '%unqueue-withdraw%'
            OR route ILIKE '%redeem-withdraw%')
           AND created_at >= NOW() - $1::interval
         GROUP BY tx_type
         ORDER BY total_builds DESC`,
        [interval],
    );
    res.json(result.rows);
}

export async function getChannelSplit(req: Request, res: Response): Promise<void> {
    const interval = getInterval(req);
    const result = await pool.query(
        `SELECT
            CASE
                WHEN path LIKE '/mcp%' THEN 'MCP'
                WHEN path LIKE '/v1/%' THEN 'REST'
                ELSE 'Other'
            END AS channel,
            COUNT(*)::int AS request_count,
            COUNT(DISTINCT api_key_id)::int AS unique_keys,
            COUNT(*) FILTER (WHERE status_code >= 400)::int AS error_count,
            ROUND(AVG(response_time))::int AS avg_response_time_ms
         FROM request_logs
         WHERE created_at >= NOW() - $1::interval
         GROUP BY channel
         ORDER BY request_count DESC`,
        [interval],
    );
    res.json(result.rows);
}
