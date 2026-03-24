/** Default MCP server URL for the hosted ATV server. */
export const MCP_SERVER_URL = "https://atv-api.aarna.ai/mcp";

/** MCP server name as registered in the protocol. */
export const MCP_SERVER_NAME = "atv";

/** MCP server version. */
export const MCP_SERVER_VERSION = "1.0.0";

/** All 20 tools exposed by the ATV MCP server. */
export const TOOLS = [
  // Discovery & metadata
  "list_vaults",
  "get_vault",
  // Performance metrics
  "get_vault_nav",
  "get_vault_tvl",
  "get_vault_apy",
  // Operational status
  "get_deposit_status",
  "get_withdraw_status",
  "get_queue_withdraw_status",
  // Transaction builders (instant)
  "build_deposit_tx",
  "build_withdraw_tx",
  "build_stake_tx",
  "build_unstake_tx",
  // Transaction builders (queued)
  "build_queue_withdraw_tx",
  "build_unqueue_withdraw_tx",
  "build_redeem_withdraw_tx",
  // Analytics
  "get_vault_portfolio",
  "get_historical_nav",
  "get_historical_tvl",
  "get_total_tvl",
  "get_user_investments",
] as const;

export type AtvTool = (typeof TOOLS)[number];

/**
 * Generate an MCP client config object for connecting to the ATV server.
 *
 * Drop the result into `claude_desktop_config.json`, `.cursor/mcp.json`,
 * or `.vscode/settings.json` under `mcp.servers`.
 */
export function mcpConfig(apiKey: string, url = MCP_SERVER_URL) {
  return {
    mcpServers: {
      atv: {
        url,
        headers: { "x-api-key": apiKey },
      },
    },
  };
}
