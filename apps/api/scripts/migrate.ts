#!/usr/bin/env ts-node
/**
 * Runs all pending migrations against DATABASE_URL.
 * Usage: ts-node scripts/migrate.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Load .env from apps/api/.env
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            console.log(`Running migration: ${file}`);
            await client.query(sql);
            console.log(`✅ ${file} complete`);
        }
        console.log('\nAll migrations applied.');
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
