# Customer Onboarding & API Key Management

This guide is for **internal operators** managing API access to the ATV SDK service.

---

## Tiers

| Tier         | Rate limit       |
|--------------|------------------|
| `free`       | 60 req / min     |
| `pro`        | 300 req / min    |
| `enterprise` | 1,000 req / min  |

---

## Generating a Key

Run the following from the repo root. The API server does **not** need to be running, but `DATABASE_URL` must be set in your `.env`.

```bash
pnpm seed-key -- --name="Acme Corp" --tier=pro
```

**Output:**

```
✅ API key created successfully
─────────────────────────────────────────
Name:       Acme Corp
Tier:       pro (300 req/min)
Key prefix: atv_a1b2...

🔑 Raw key (save this — shown only once):

   atv_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

─────────────────────────────────────────
```

> **The raw key is hashed on write and never stored in plaintext. It cannot be recovered — only revoked and reissued.**

Copy the raw key immediately and deliver it to the customer via a secure channel (e.g. 1Password share, encrypted email, Vault). Do not paste it into Slack, email body, or any unencrypted channel.

---

## Customer Usage

Customers pass the key as an HTTP header on every request:

```bash
curl https://your-api.com/v1/vaults \
  -H "x-api-key: atv_a1b2c3d4e5f6..."
```

Or via the TypeScript SDK:

```ts
import { AtvClient } from '@atv/sdk';

const client = new AtvClient({
    apiKey: 'atv_a1b2c3d4e5f6...',
    baseUrl: 'https://your-api.com',
});

const vaults = await client.vaults.list();
```

Rate limit status is returned in every response:

| Header                  | Description                          |
|-------------------------|--------------------------------------|
| `X-RateLimit-Limit`     | Max requests allowed per minute      |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset`     | Unix timestamp when the window resets |

---

## Revoking a Key

To immediately block access for a customer:

```sql
UPDATE api_keys SET is_active = false WHERE name = 'Acme Corp';
```

To permanently delete:

```sql
DELETE FROM api_keys WHERE name = 'Acme Corp';
```

After revoking, any request using the old key will receive `401 Unauthorized`. Issue a new key if the customer needs continued access.

---

## Admin Queries

**List all active keys:**

```sql
SELECT id, name, key_prefix, tier, rate_limit_per_minute, created_at, last_used_at, usage_count
FROM api_keys
WHERE is_active = true
ORDER BY created_at DESC;
```

**Find a key by prefix** (the first 8 characters are shown in the output when a key is created):

```sql
SELECT * FROM api_keys WHERE key_prefix = 'atv_a1b2';
```

**Usage summary by tier:**

```sql
SELECT tier, COUNT(*) AS keys, SUM(usage_count) AS total_requests
FROM api_keys
WHERE is_active = true
GROUP BY tier;
```

---

## Re-issuing a Key

There is no in-place rotation. To reissue:

1. Revoke the old key (see above)
2. Generate a new one with `pnpm seed-key`
3. Deliver the new key to the customer securely
