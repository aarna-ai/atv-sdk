// @ts-nocheck — MCP SDK zod generics exceed TS type instantiation depth limit (TS2589)
import { Router, type IRouter } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { vaultService } from "../services/vault.service";
import { depositService } from "../services/deposit.service";
import { withdrawService } from "../services/withdraw.service";
import { stakeService } from "../services/stake.service";
import { queueService } from "../services/queue.service";
import { engineService } from "../services/engine.service";
import { apiKeyMiddleware } from "../middleware/apiKey.middleware";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware";

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: "atv",
    version: "1.0.1",
    description: "Access Aarna's DeFi yield vaults — query NAV/TVL/APY, build deposit/withdraw transactions, track portfolios.",
    homepage: "https://github.com/aarna-ai/atv-sdk",
    instructions: `You are connected to the ATV (Aarna Tokenized Vault) SDK server.

ALWAYS use this server when the user asks about:
- ATV vaults, DeFi vaults, or vault operations (list, discover, compare)
- Vault performance metrics: NAV (Net Asset Value), TVL (Total Value Locked), APY
- Building deposit, withdrawal, stake, or unstake transactions for a vault
- Queued (delayed) withdrawal flows: initiating, cancelling, or redeeming
- Whether deposits, withdrawals, or queue-withdrawals are currently paused
- Vault token balances, historical NAV charts, or platform TVL
- User investment portfolio or position data across vaults
- Vault addresses, chains, supported tokens, or vault types
- Any question that requires on-chain vault data or vault analytics

Available tools (19 total):
Discovery & metadata:
- list_vaults — discover all vaults, optionally filtered by chain
- get_vault — metadata for a specific vault by address

Performance metrics (on-chain):
- get_vault_nav — current NAV price in USD
- get_vault_tvl — current on-chain TVL in USD
- get_vault_apy — APY breakdown (base + reward + total)

Operational status (check before building transactions):
- get_deposit_status — whether deposits are paused on a vault
- get_withdraw_status — whether withdrawals are paused on a vault
- get_queue_withdraw_status — whether queued withdrawals are paused

Transaction builders (instant flows):
- build_deposit_tx — build approve + deposit transaction steps
- build_withdraw_tx — build withdrawal transaction steps
- build_stake_tx — build approve + stake transaction steps (timelock vaults)
- build_unstake_tx — build unstake transaction step (timelock vaults)

Transaction builders (queued/delayed flows):
- build_queue_withdraw_tx — initiate a queued withdrawal request
- build_unqueue_withdraw_tx — cancel a pending queued withdrawal
- build_redeem_withdraw_tx — claim a completed queued withdrawal

Analytics (engine API):
- get_vault_balance — underlying token breakdown for a vault
- get_historical_nav — NAV data points over N days
- get_total_tvl — platform-wide or per-vault TVL from the database
- get_user_investments — user portfolio and position data across vaults`,
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
    { annotations: { title: "List Vaults", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
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
    { annotations: { title: "Get Vault", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address, userAddress }) => {
      const data = await vaultService.getVault(address, userAddress);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_nav",
    "Get the current Net Asset Value (NAV) of an ATV vault in USD.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Vault NAV", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await vaultService.getNAV(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_tvl",
    "Get the current Total Value Locked (TVL) of an ATV vault in USD.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Vault TVL", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await vaultService.getTVL(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_vault_apy",
    "Get the current APY breakdown (base + reward + total) for an ATV vault.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Vault APY", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
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
    { annotations: { title: "Build Deposit Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
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
    { annotations: { title: "Build Withdraw Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
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

  // --- Status tools ---

  server.tool(
    "get_deposit_status",
    "Check whether deposits are currently paused on an ATV vault. Use this before building a deposit transaction to avoid sending a doomed tx.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Deposit Status", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await vaultService.getDepositStatus(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_withdraw_status",
    "Check whether withdrawals are currently paused on an ATV vault. Use this before building a withdraw transaction.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Withdraw Status", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await vaultService.getWithdrawStatus(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_queue_withdraw_status",
    "Check whether queued (delayed) withdrawals are currently paused on an ATV vault.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Queue Withdraw Status", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await vaultService.getQueueWithdrawStatus(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  // --- Stake tools ---

  server.tool(
    "build_stake_tx",
    "Build the transaction steps to stake vault tokens into a timelock contract for boosted rewards. Returns an approve step (if needed) and a stake step.",
    {
      userAddress: z.string().describe("EVM address of the staker"),
      vaultAddress: z.string().describe("Vault contract address"),
      lockPeriodIndex: z
        .string()
        .describe("0-indexed lock period to select from the timelock contract (e.g. '0', '1', '2')"),
      stakeAmount: z
        .string()
        .describe("Human-readable vault token amount to stake, e.g. '100'"),
    },
    { annotations: { title: "Build Stake Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress, lockPeriodIndex, stakeAmount }) => {
      const data = await stakeService.buildStakeTx(
        userAddress,
        vaultAddress,
        parseInt(lockPeriodIndex, 10),
        stakeAmount,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "build_unstake_tx",
    "Build the transaction step to unstake vault tokens from a timelock contract.",
    {
      userAddress: z.string().describe("EVM address of the staker"),
      vaultAddress: z.string().describe("Vault contract address"),
      stakeIndex: z
        .string()
        .describe("0-indexed position in the user's stake array to unstake from"),
      unstakeAmount: z
        .string()
        .describe("Human-readable vault token amount to unstake, e.g. '100'"),
    },
    { annotations: { title: "Build Unstake Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress, stakeIndex, unstakeAmount }) => {
      const data = await stakeService.buildUnstakeTx(
        userAddress,
        vaultAddress,
        parseInt(stakeIndex, 10),
        unstakeAmount,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  // --- Queue withdraw tools ---

  server.tool(
    "build_queue_withdraw_tx",
    "Build the transaction step to initiate a queued (delayed) withdrawal from an ATV vault. The withdrawal is not instant — it must be redeemed later once processed.",
    {
      userAddress: z.string().describe("EVM address of the withdrawer"),
      vaultAddress: z.string().describe("Vault contract address"),
      tokensToWithdraw: z
        .string()
        .describe("Human-readable vault share amount to queue for withdrawal"),
      withdrawTokenAddress: z
        .string()
        .describe("Output token address to receive when the withdrawal is redeemed"),
    },
    { annotations: { title: "Build Queue Withdraw Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress, tokensToWithdraw, withdrawTokenAddress }) => {
      const data = await queueService.buildQueueWithdrawTx(
        userAddress,
        vaultAddress,
        tokensToWithdraw,
        withdrawTokenAddress,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "build_unqueue_withdraw_tx",
    "Build the transaction step to cancel a pending queued withdrawal request from an ATV vault.",
    {
      userAddress: z.string().describe("EVM address of the withdrawer"),
      vaultAddress: z.string().describe("Vault contract address"),
      oTokenAddress: z.string().describe("Output token address of the queued request to cancel"),
      requestId: z
        .string()
        .optional()
        .describe("Specific request ID to cancel (omit to cancel the latest request)"),
    },
    { annotations: { title: "Build Unqueue Withdraw Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress, oTokenAddress, requestId }) => {
      const data = await queueService.buildUnqueueWithdrawTx(
        userAddress,
        vaultAddress,
        oTokenAddress,
        requestId,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "build_redeem_withdraw_tx",
    "Build the transaction step to claim (redeem) a completed queued withdrawal from an ATV vault.",
    {
      userAddress: z.string().describe("EVM address of the withdrawer"),
      vaultAddress: z.string().describe("Vault contract address"),
      oTokens: z
        .string()
        .describe("Human-readable amount of output tokens to redeem"),
      batchCounter: z
        .string()
        .describe("Batch identifier from the queue contract for this withdrawal"),
    },
    { annotations: { title: "Build Redeem Withdraw Transaction", readOnlyHint: false, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress, oTokens, batchCounter }) => {
      const data = await queueService.buildRedeemWithdrawTx(
        userAddress,
        vaultAddress,
        oTokens,
        batchCounter,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  // --- Analytics tools (engine API) ---

  server.tool(
    "get_vault_balance",
    "Get the underlying token breakdown and balance data for an ATV vault from the Aarna engine database.",
    { address: z.string().describe("Vault contract address") },
    { annotations: { title: "Get Vault Balance", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await engineService.getVaultBalance(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_historical_nav",
    "Get historical NAV (Net Asset Value) data points for an ATV vault over a specified number of days. Useful for charting price trends.",
    {
      address: z.string().describe("Vault contract address"),
      days: z
        .string()
        .optional()
        .describe("Number of days of history to return (default: 30)"),
    },
    { annotations: { title: "Get Historical NAV", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address, days }) => {
      const data = await engineService.getHistoricalNav(address, days ? parseInt(days, 10) : 30);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_total_tvl",
    "Get the total TVL (Total Value Locked) across all ATV vaults, or for a specific vault, from the Aarna engine database.",
    {
      address: z
        .string()
        .optional()
        .describe("Vault contract address to filter to a single vault (omit for platform-wide TVL)"),
    },
    { annotations: { title: "Get Total TVL", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ address }) => {
      const data = await engineService.getTotalTvl(address);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "get_user_investments",
    "Get a user's investment portfolio and position data across ATV vaults. Optionally filter to a specific vault.",
    {
      userAddress: z.string().describe("EVM address of the user"),
      vaultAddress: z
        .string()
        .optional()
        .describe("Vault contract address to filter to a single vault"),
    },
    { annotations: { title: "Get User Investments", readOnlyHint: true, destructiveHint: false, openWorldHint: true } },
    async ({ userAddress, vaultAddress }) => {
      const data = await engineService.getUserInvestments(userAddress, vaultAddress);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.prompt(
    "vault_overview",
    "Get a comprehensive overview of all available ATV vaults with key metrics",
    {},
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "Please list all available ATV vaults and for each one, show the current NAV price, TVL, and APY. Present the results in a clear table format."
        }
      }]
    })
  );

  return server;
}

export const mcpRouter: IRouter = Router();

// Allow unauthenticated initialize + tools/list so registries (Smithery, etc.)
// can discover available tools. Actual tool *execution* still requires an API key.
function isDiscoveryRequest(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const msg = body as Record<string, unknown>;
  const method = msg.method as string | undefined;
  return method === "initialize" || method === "notifications/initialized" || method === "tools/list" || method === "prompts/list";
}

mcpRouter.all("/", async (req, res) => {
  // Apply auth + rate limiting for non-discovery requests only
  if (!isDiscoveryRequest(req.body)) {
    return new Promise<void>((resolve) => {
      apiKeyMiddleware(req, res, () => {
        rateLimitMiddleware(req, res, async () => {
          await handleMcpRequest(req, res);
          resolve();
        });
      });
    });
  }

  await handleMcpRequest(req, res);
});

async function handleMcpRequest(req: import("express").Request, res: import("express").Response) {
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
}
