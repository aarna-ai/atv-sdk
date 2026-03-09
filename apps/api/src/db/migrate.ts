import * as fs from 'fs';
import * as path from 'path';
import { pool } from './postgres';

export async function runMigrations(): Promise<void> {
    const client = await pool.connect();
    try {
        // Create tracking table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                name       TEXT        PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Read migration files sorted by name
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        // Find already-applied migrations
        const { rows } = await client.query<{ name: string }>(
            'SELECT name FROM schema_migrations'
        );
        const applied = new Set(rows.map(r => r.name));

        // Run only pending migrations, each in its own transaction
        for (const file of files) {
            if (applied.has(file)) {
                console.log(`  [skip] ${file}`);
                continue;
            }
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (name) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`  [ok]   ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration failed (${file}): ${(err as Error).message}`);
            }
        }
    } finally {
        client.release();
    }
}
