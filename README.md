# ATV SDK

Monetizable API service for exposing ATV vault deposit/withdraw transaction data to integrators, plus a TypeScript SDK for consuming it.

## Repository Structure

```
atv-sdk/
├── apps/
│   └── api/          # Express API server
└── packages/
    └── sdk/          # TypeScript SDK (npm package)
```

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- Redis

## Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp .env.example apps/api/.env
# Fill in DATABASE_URL, REDIS_URL, RPC URLs, and Strapi credentials
```

**3. Run the database migration**

```bash
pnpm migrate
```

**4. Start the development server**

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`.
Interactive API docs are at `http://localhost:3000/docs`.

## API Overview

All endpoints are prefixed with `/v1` and require an `x-api-key` header.

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/v1/vaults`                  | List all available vaults       |
| GET    | `/v1/vaults/:address/nav`     | Net Asset Value for a vault     |
| GET    | `/v1/vaults/:address/tvl`     | Total Value Locked for a vault  |
| GET    | `/v1/vaults/:address/apy`     | APY for a vault                 |
| GET    | `/v1/deposit-tx`              | Build deposit calldata          |
| GET    | `/v1/withdraw-tx`             | Build withdraw calldata         |
| GET    | `/v1/flux-withdraw-tx`        | Build queued withdraw calldata  |

Unauthenticated endpoints:

| Method | Path           | Description            |
|--------|----------------|------------------------|
| GET    | `/health`      | Health check           |
| GET    | `/openapi.json`| Raw OpenAPI 3.1 spec   |
| GET    | `/docs`        | Interactive API docs   |

## SDK Usage

```ts
import { AtvClient } from '@atv/sdk';

const client = new AtvClient({
    apiKey: 'atv_...',
    baseUrl: 'https://your-api.com',
});

const vaults = await client.vaults.list({ chain: 'base' });
const nav    = await client.vaults.nav('0xVaultAddress');
```

## Customer Onboarding

See [docs/customer-onboarding.md](docs/customer-onboarding.md) for how to generate API keys, manage tiers, revoke access, and run admin queries.

## Building for Production

```bash
pnpm build
# API output: apps/api/dist/
# SDK output: packages/sdk/dist/  (CJS + ESM)
```
