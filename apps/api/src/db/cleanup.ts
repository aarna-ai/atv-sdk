import { pool } from './postgres';
import { env } from '../config/env';

export function scheduleLogCleanup(): void {
    const run = async () => {
        try {
            const result = await pool.query(
                'DELETE FROM request_logs WHERE created_at < NOW() - make_interval(days => $1)',
                [env.LOG_RETENTION_DAYS],
            );
            if (result.rowCount && result.rowCount > 0) {
                console.log(`Cleaned up ${result.rowCount} old request log rows`);
            }
        } catch (err) {
            console.error('Log cleanup failed:', err);
        }
    };

    // Run once on startup, then daily
    run();
    setInterval(run, 24 * 60 * 60 * 1000);
}
