import { z } from "zod";
import { AtvService } from "./atv.service";
import {
  listVaultsParameters,
  getVaultNavParameters,
  getVaultTvlParameters,
  getVaultApyParameters,
  buildDepositTxParameters,
  buildWithdrawTxParameters,
} from "./parameters";

export interface AtvPluginConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AtvTool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any) => Promise<any>;
}

export function atv(config: AtvPluginConfig): {
  name: string;
  tools: AtvTool[];
} {
  const service = new AtvService(config);

  return {
    name: "atv",
    tools: [
      {
        name: "atv_list_vaults",
        description:
          "List available ATV DeFi yield vaults. Optionally filter by chain (ethereum, base).",
        parameters: listVaultsParameters,
        execute: async (params: z.infer<typeof listVaultsParameters>) =>
          JSON.stringify(await service.listVaults(params)),
      },
      {
        name: "atv_get_vault_nav",
        description:
          "Get the current NAV (Net Asset Value) of an ATV vault in USD.",
        parameters: getVaultNavParameters,
        execute: async (params: z.infer<typeof getVaultNavParameters>) =>
          JSON.stringify(await service.getVaultNav(params.address)),
      },
      {
        name: "atv_get_vault_tvl",
        description:
          "Get the current TVL (Total Value Locked) of an ATV vault in USD.",
        parameters: getVaultTvlParameters,
        execute: async (params: z.infer<typeof getVaultTvlParameters>) =>
          JSON.stringify(await service.getVaultTvl(params.address)),
      },
      {
        name: "atv_get_vault_apy",
        description:
          "Get the APY breakdown (base + reward + total) for an ATV vault.",
        parameters: getVaultApyParameters,
        execute: async (params: z.infer<typeof getVaultApyParameters>) =>
          JSON.stringify(await service.getVaultApy(params.address)),
      },
      {
        name: "atv_build_deposit_tx",
        description:
          "Build approve + deposit transaction steps for depositing tokens into an ATV vault. Returns ordered transactions that must be sent sequentially.",
        parameters: buildDepositTxParameters,
        execute: async (params: z.infer<typeof buildDepositTxParameters>) =>
          JSON.stringify(await service.buildDepositTx(params)),
      },
      {
        name: "atv_build_withdraw_tx",
        description:
          "Build withdrawal transaction steps for withdrawing from an ATV vault.",
        parameters: buildWithdrawTxParameters,
        execute: async (params: z.infer<typeof buildWithdrawTxParameters>) =>
          JSON.stringify(await service.buildWithdrawTx(params)),
      },
    ],
  };
}
