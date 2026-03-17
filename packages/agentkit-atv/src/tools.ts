import type { z } from "zod";
import { AtvActionProvider } from "./atvActionProvider";
import {
  listVaultsSchema,
  getVaultApySchema,
  getVaultNavSchema,
  getVaultTvlSchema,
  buildDepositTxSchema,
  buildWithdrawTxSchema,
} from "./schemas";

export interface AtvTool<S extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: S;
  execute: (params: z.infer<S>) => Promise<unknown>;
}

/**
 * Returns an array of tool definitions that wrap the ATV action provider.
 * Compatible with the Coinbase AgentKit tool pattern.
 */
export function getAtvTools(provider: AtvActionProvider): AtvTool[] {
  return [
    {
      name: "atv_list_vaults",
      description:
        "List available ATV DeFi yield vaults. Optionally filter by chain (ethereum, base) or include user balance info by passing a wallet address.",
      schema: listVaultsSchema,
      execute: (params) => provider.listVaults(params),
    },
    {
      name: "atv_get_vault_apy",
      description:
        "Get the current APY (Annual Percentage Yield) for a specific ATV vault by its contract address.",
      schema: getVaultApySchema,
      execute: (params) => provider.getVaultApy(params),
    },
    {
      name: "atv_get_vault_nav",
      description:
        "Get the current NAV (Net Asset Value) price for a specific ATV vault by its contract address.",
      schema: getVaultNavSchema,
      execute: (params) => provider.getVaultNav(params),
    },
    {
      name: "atv_get_vault_tvl",
      description:
        "Get the current TVL (Total Value Locked) for a specific ATV vault by its contract address.",
      schema: getVaultTvlSchema,
      execute: (params) => provider.getVaultTvl(params),
    },
    {
      name: "atv_build_deposit_tx",
      description:
        "Build deposit transaction calldata for an ATV vault. Returns an approve transaction and a deposit transaction that must be sent in order.",
      schema: buildDepositTxSchema,
      execute: (params) => provider.buildDepositTx(params),
    },
    {
      name: "atv_build_withdraw_tx",
      description:
        "Build a withdraw transaction for an ATV vault. Specify the vault, output token, shares to withdraw, and optional slippage tolerance.",
      schema: buildWithdrawTxSchema,
      execute: (params) => provider.buildWithdrawTx(params),
    },
  ];
}
