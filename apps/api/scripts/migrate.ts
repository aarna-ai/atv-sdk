#!/usr/bin/env ts-node
/**
 * Standalone migration runner.
 * Usage: pnpm --filter api migrate
 */
import * as path from 'path';

const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

import { pool } from '../src/db/postgres';
import { runMigrations } from '../src/db/migrate';

async function main() {
    console.log('Running migrations...');
    await runMigrations();
    console.log('Done.');
    await pool.end();
}

main().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
