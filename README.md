# ATV — DeFi Yield Vault MCP Server

[![npm version](https://img.shields.io/npm/v/@aarna-ai/mcp-server-atv)](https://www.npmjs.com/package/@aarna-ai/mcp-server-atv)
[![smithery badge](https://smithery.ai/badge/aarna-ai/atv)](https://smithery.ai/servers/aarna-ai/atv)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.aarna--ai%2Fatv-blue)](https://registry.modelcontextprotocol.io/servers/io.github.aarna-ai/atv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/github/stars/aarna-ai/atv-sdk?style=social)](https://github.com/aarna-ai/atv-sdk)

AI-native access to Aarna's tokenized yield vaults on Ethereum and Base. 20 tools for vault discovery, performance metrics, transaction building, and portfolio tracking.

**API Base URL:** `https://atv-api.aarna.ai`
**MCP Endpoint:** `https://atv-api.aarna.ai/mcp` (Streamable HTTP)
**API Docs:** `https://atv-api.aarna.ai/docs`

## API Access

The hosted API at `https://atv-api.aarna.ai` is available to anyone with a valid API key. All requests require an `x-api-key` header.

To get an API key, reach out to us at **dev@aarnalab.dev**.

## Quick Start (30 seconds)

Once you have your API key, add the config to your client:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atv": {
      "url": "https://atv-api.aarna.ai/mcp",
      "headers": { "x-api-key": "YOUR_API_KEY" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add atv --transport http https://atv-api.aarna.ai/mcp --header "x-api-key: YOUR_API_KEY"
```

### Cursor

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "atv": {
      "url": "https://atv-api.aarna.ai/mcp",
      "headers": { "x-api-key": "YOUR_API_KEY" }
    }
  }
}
```

### VS Code (Copilot)

Add to `.vscode/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "atv": {
        "url": "https://atv-api.aarna.ai/mcp",
        "headers": { "x-api-key": "YOUR_API_KEY" }
      }
    }
  }
}
```

### mcp-remote (fallback for stdio-only clients)

```json
{
  "mcpServers": {
    "atv": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://atv-api.aarna.ai/mcp", "--header", "x-api-key:YOUR_API_KEY"]
    }
  }
}
```

## Available Tools (19)

### Discovery & Metadata
| Tool | Description |
|------|-------------|
| `list_vaults` | List all vaults, optionally filter by chain |
| `get_vault` | Get metadata for a specific vault by address |

### Performance Metrics
| Tool | Description |
|------|-------------|
| `get_vault_nav` | Current NAV (Net Asset Value) in USD |
| `get_vault_tvl` | Current TVL (Total Value Locked) in USD |
| `get_vault_apy` | APY breakdown: base + reward + total |

### Operational Status
| Tool | Description |
|------|-------------|
| `get_deposit_status` | Whether deposits are paused |
| `get_withdraw_status` | Whether withdrawals are paused |
| `get_queue_withdraw_status` | Whether queued withdrawals are paused |

### Transaction Builders (Instant)
| Tool | Description |
|------|-------------|
| `build_deposit_tx` | Build approve + deposit transaction steps |
| `build_withdraw_tx` | Build withdrawal transaction steps |
| `build_stake_tx` | Build approve + stake steps (timelock vaults) |
| `build_unstake_tx` | Build unstake step (timelock vaults) |

### Transaction Builders (Queued)
| Tool | Description |
|------|-------------|
| `build_queue_withdraw_tx` | Initiate a queued withdrawal |
| `build_unqueue_withdraw_tx` | Cancel a pending queued withdrawal |
| `build_redeem_withdraw_tx` | Claim a completed queued withdrawal |

### Analytics
| Tool | Description |
|------|-------------|
| `get_vault_portfolio` | Underlying token portfolio |
| `get_historical_nav` | NAV data points over a period (7, 30, 60, 360, max) |
| `get_historical_tvl` | TVL data points over a period (7, 30, 60, 360, max) |
| `get_total_tvl` | Platform-wide or per-vault TVL |
| `get_user_investments` | User portfolio and positions |

## Example Prompts

- "What DeFi vaults are available on Base?"
- "What's the current APY for vault 0x...?"
- "Build a deposit of 1000 USDC into vault 0x..."
- "Show my portfolio across all Aarna vaults"
- "Is the queue-withdraw paused on vault 0x...?"

## REST API

All endpoints require `x-api-key` header and are prefixed with `/v1`.

### Vault Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/vaults` | List all available vaults |
| GET | `/v1/vaults/tvl` | Platform-wide TVL |
| GET | `/v1/vaults/:address` | Vault metadata |
| GET | `/v1/vaults/:address/nav` | NAV price |
| GET | `/v1/vaults/:address/tvl` | Vault TVL |
| GET | `/v1/vaults/:address/apy` | APY breakdown |
| GET | `/v1/vaults/:address/deposit-status` | Deposit pause status |
| GET | `/v1/vaults/:address/withdraw-status` | Withdraw pause status |
| GET | `/v1/vaults/:address/queue-withdraw-status` | Queue-withdraw pause status |
| GET | `/v1/vaults/:address/portfolio` | Token portfolio |
| GET | `/v1/vaults/:address/historical-nav` | Historical NAV (days: 7,30,60,360,max) |
| GET | `/v1/vaults/:address/historical-tvl` | Historical TVL (days: 7,30,60,360,max) |

### Transaction Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/deposit-tx` | Build deposit calldata |
| GET | `/v1/withdraw-tx` | Build withdraw calldata |
| GET | `/v1/stake-tx` | Build stake calldata |
| GET | `/v1/unstake-tx` | Build unstake calldata |
| GET | `/v1/queue-withdraw-tx` | Build queue-withdraw calldata |
| GET | `/v1/unqueue-withdraw-tx` | Build unqueue-withdraw calldata |
| GET | `/v1/redeem-withdraw-tx` | Build redeem-withdraw calldata |

### Other Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/user-investments` | User portfolio data |
| ALL | `/mcp` | MCP server (Streamable HTTP) |

### Unauthenticated
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/openapi.json` | OpenAPI 3.1 spec |
| GET | `/docs` | Interactive API reference |
| GET | `/.well-known/agent.json` | A2A agent card |

## TypeScript SDK

```ts
import { AtvClient } from '@atv/sdk';

const client = new AtvClient({
  apiKey: 'atv_...',
  baseUrl: 'https://atv-api.aarna.ai',
});

const vaults = await client.vaults.list({ chain: 'base' });
const nav = await client.vaults.nav('0xVaultAddress');
```

## Self-Hosting

```bash
docker build -t atv-api \
  --build-arg AWS_ACCESS_KEY_ID=... \
  --build-arg AWS_SECRET_ACCESS_KEY=... \
  --build-arg AWS_DEFAULT_REGION=us-east-1 .

docker run -p 3000:3000 atv-api
```

Required environment variables (set in AWS Secrets Manager under `atv-sdk`):
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis host:port
- `RPC_URL_ETHEREUM` — Ethereum JSON-RPC endpoint
- `RPC_URL_BASE` — Base JSON-RPC endpoint
- `STRAPI_URL` — CMS URL
- `STRAPI_API_TOKEN` — CMS API token
- `ENGINE_BASE_URL` — Aarna engine API

## Development

### Prerequisites
- Node.js 20+
- pnpm
- PostgreSQL
- Redis

### Setup

```bash
pnpm install
cp .env.example apps/api/.env
# Fill in environment variables
pnpm migrate
pnpm dev
```

API: `http://localhost:3000` | Docs: `http://localhost:3000/docs`

### Repository Structure

```
atv-sdk/
├── apps/api/              # Express API server + MCP server
├── packages/sdk/          # TypeScript SDK (@atv/sdk)
├── packages/mcp-server/   # npm connector package (@aarna-ai/mcp-server-atv)
├── server.json            # MCP registry manifest
└── docs/                  # Guides
```

### Build

```bash
pnpm build
# API: apps/api/dist/
# SDK: packages/sdk/dist/ (CJS + ESM)
```

## Customer Onboarding

See [docs/customer-onboarding.md](docs/customer-onboarding.md) for how to generate API keys, manage tiers, revoke access, and run admin queries.

## License

MIT — see [LICENSE](LICENSE).
