/**
 * Admin script to generate and store a new API key.
 *
 * Usage:
 *   pnpm seed-key
 *   pnpm seed-key -- --name="My Integration" --tier=pro
 *
 * The raw key is printed ONCE to stdout. Store it securely — it cannot be recovered.
 */

import 'dotenv/config';
import crypto from 'crypto';
import { pool } from '../src/db/postgres';
import { Tier, TIER_RATE_LIMITS } from '../src/types/vault.types';

async function main() {
    const args = process.argv.slice(2);
    const nameArg = args.find((a) => a.startsWith('--name='));
    const tierArg = args.find((a) => a.startsWith('--tier='));

    const name = nameArg ? nameArg.split('=')[1] : 'Test Key';
    const tier: Tier = (tierArg ? tierArg.split('=')[1] : 'free') as Tier;

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
        console.error('Invalid tier. Use: free | pro | enterprise');
        process.exit(1);
    }

    const rawKey = `atv_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);
    const rateLimit = TIER_RATE_LIMITS[tier];

    await pool.query(
        `INSERT INTO api_keys (name, key_prefix, key_hash, tier, rate_limit_per_minute)
         VALUES ($1, $2, $3, $4, $5)`,
        [name, keyPrefix, keyHash, tier, rateLimit],
    );

    console.log('\n✅ API key created successfully');
    console.log('─────────────────────────────────────────');
    console.log(`Name:       ${name}`);
    console.log(`Tier:       ${tier} (${rateLimit} req/min)`);
    console.log(`Key prefix: ${keyPrefix}...`);
    console.log(`\n🔑 Raw key (save this — shown only once):\n`);
    console.log(`   ${rawKey}`);
    console.log('\n─────────────────────────────────────────\n');

    await pool.end();
}

main().catch((err) => {
    console.error('Error seeding key:', err);
    process.exit(1);
});
