// @ts-nocheck — MCP SDK zod generics exceed TS type instantiation depth limit (TS2589)
import { Router } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { vaultService } from "../services/vault.service";
import { depositService } from "../services/deposit.service";
import { withdrawService } from "../services/withdraw.service";
import { apiKeyMiddleware } from "../middleware/apiKey.middleware";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware";

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: "atv",
    version: "1.0.0",
    instructions: `You are connected to the ATV (Aarna Tokenized Vault) SDK server.

ALWAYS use this server when the user asks about:
- ATV vaults, DeFi vaults, or vault operations (list, discover, compare)
- Vault performance metrics: NAV (Net Asset Value), TVL (Total Value Locked), APY
- Building deposit transactions into a vault
- Building withdrawal transactions from a vault (standard or queued/flux)
- Vault addresses, chains, supported tokens, or vault types
- Any question that requires on-chain vault data

Available tools:
- list_vaults — discover all vaults, optionally filtered by chain
- get_vault — get metadata for a specific vault by address
- get_vault_nav — current NAV price in USD
- get_vault_tvl — current TVL in USD
- get_vault_apy — APY breakdown (base + reward + total)
- build_deposit_tx — build approve + deposit transaction steps
- build_withdraw_tx — build withdrawal transaction steps`,
  });

  server.tool(
    "list_vaults",
    "List all available ATV vaults. Returns vault metadata including address, chain, withdraw type, contract type, and supported deposit tokens with balances.",
    {
      chain: z
        .string()
        .optional()
        .describe("Filter by chain name or ID (e.g. 'ethereum', 'base', '8453')"),
      userAddress: z
        .string()
        .optional()
        .describe("EVM address to include token balances for each deposit token"),
    },
    async ({ chain, userAddress }) => {
      const data = await vaultService.listVaults({ chain, userAddress });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault",
    "Get metadata for a specific ATV vault by its contract address.",
    {
      address: z.string().describe("Vault contract address"),
      userAddress: z
        .string()
        .optional()
        .describe("EVM address to include token balances for"),
    },
    async ({ address, userAddress }) => {
      const data = await vaultService.getVault(address, userAddress);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_nav",
    "Get the current Net Asset Value (NAV) of an ATV vault in USD.",
    { address: z.string().describe("Vault contract address") },
    async ({ address }) => {
      const data = await vaultService.getNAV(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_tvl",
    "Get the current Total Value Locked (TVL) of an ATV vault in USD.",
    { address: z.string().describe("Vault contract address") },
    async ({ address }) => {
      const data = await vaultService.getTVL(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_apy",
    "Get the current APY breakdown (base + reward + total) for an ATV vault.",
    { address: z.string().describe("Vault contract address") },
    async ({ address }) => {
      const data = await vaultService.getAPY(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "build_deposit_tx",
    "Build the transaction steps required to deposit tokens into an ATV vault. Returns an ordered array of transactions (approve then deposit) that must be sent in order.",
    {
      userAddress: z.string().describe("EVM address of the depositor"),
      vaultAddress: z.string().describe("Vault contract address"),
      depositTokenAddress: z.string().describe("ERC20 token address to deposit"),
      depositAmount: z
        .string()
        .describe("Human-readable deposit amount, e.g. '100' for 100 USDC"),
    },
    async ({ userAddress, vaultAddress, depositTokenAddress, depositAmount }) => {
      const data = await depositService.buildDepositTx(
        userAddress,
        vaultAddress,
        depositTokenAddress,
        depositAmount,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "build_withdraw_tx",
    "Build the transaction steps required to withdraw vault shares from an ATV vault and receive an output token.",
    {
      userAddress: z.string().describe("EVM address of the withdrawer"),
      vaultAddress: z.string().describe("Vault contract address"),
      oTokenAddress: z.string().describe("Output token address to receive"),
      sharesToWithdraw: z
        .string()
        .describe("Human-readable share amount to withdraw, e.g. '100'"),
      slippage: z
        .string()
        .optional()
        .describe("Slippage tolerance as a percentage, e.g. '0.5'"),
      simulate: z
        .string()
        .optional()
        .describe("Pass 'true' to include a gas estimate in the response"),
    },
    async ({
      userAddress,
      vaultAddress,
      oTokenAddress,
      sharesToWithdraw,
      slippage,
      simulate,
    }) => {
      const data = await withdrawService.buildWithdrawTx({
        userAddress,
        vaultAddress,
        oTokenAddress,
        sharesToWithdraw,
        slippage: slippage ? Number(slippage) : undefined,
        simulate: simulate === "true",
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  return server;
}

export const mcpRouter = Router();

mcpRouter.use(apiKeyMiddleware);
mcpRouter.use(rateLimitMiddleware);

mcpRouter.all("/", async (req, res) => {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  res.on("finish", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
