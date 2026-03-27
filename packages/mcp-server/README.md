# @aarna-ai/mcp-server-atv

[![npm version](https://img.shields.io/npm/v/@aarna-ai/mcp-server-atv)](https://www.npmjs.com/package/@aarna-ai/mcp-server-atv)
[![npm downloads](https://img.shields.io/npm/dm/@aarna-ai/mcp-server-atv?logo=npm&color=CB3837)](https://www.npmjs.com/package/@aarna-ai/mcp-server-atv)

MCP server connector for **ATV** — AI-native access to Aarna's tokenized DeFi yield vaults on Ethereum and Base.

20 tools for vault discovery, performance metrics (NAV, TVL, APY), deposit/withdraw/stake transaction building, and portfolio tracking.

## Setup

Get an API key from [Aarna](https://aarna.ai), then add the config to your MCP client:

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

### mcp-remote (stdio-only clients)

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

## Tools (19)

| Tool | Description |
|------|-------------|
| `list_vaults` | List all vaults, optionally filter by chain |
| `get_vault` | Vault metadata by address |
| `get_vault_nav` | Current NAV in USD |
| `get_vault_tvl` | Current TVL in USD |
| `get_vault_apy` | APY breakdown (base + reward + total) |
| `get_deposit_status` | Whether deposits are paused |
| `get_withdraw_status` | Whether withdrawals are paused |
| `get_queue_withdraw_status` | Whether queued withdrawals are paused |
| `build_deposit_tx` | Build approve + deposit steps |
| `build_withdraw_tx` | Build withdrawal steps |
| `build_stake_tx` | Build approve + stake steps |
| `build_unstake_tx` | Build unstake step |
| `build_queue_withdraw_tx` | Initiate queued withdrawal |
| `build_unqueue_withdraw_tx` | Cancel pending queued withdrawal |
| `build_redeem_withdraw_tx` | Claim completed queued withdrawal |
| `get_vault_portfolio` | Underlying token portfolio |
| `get_historical_nav` | NAV over a period (7, 30, 60, 360, max) |
| `get_historical_tvl` | TVL over a period (7, 30, 60, 360, max) |
| `get_total_tvl` | Platform-wide TVL |
| `get_user_investments` | User portfolio and positions |

## Example Prompts

- "What DeFi vaults are available on Base?"
- "What's the current APY for vault 0x...?"
- "Build a deposit of 1000 USDC into vault 0x..."
- "Show my portfolio across all Aarna vaults"
- "Is the queue-withdraw paused on vault 0x...?"

## Programmatic Usage

```ts
import { mcpConfig, TOOLS, MCP_SERVER_URL } from '@aarna-ai/mcp-server-atv';

// Generate config for any MCP client
const config = mcpConfig('your-api-key');

console.log(MCP_SERVER_URL); // https://atv-api.aarna.ai/mcp
console.log(TOOLS.length);   // 19
```

## License

MIT
