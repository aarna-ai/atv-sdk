import { z } from "zod";

export const listVaultsSchema = z.object({
  chain: z
    .string()
    .optional()
    .describe("Filter by chain name (e.g. ethereum, base)"),
  userAddress: z
    .string()
    .optional()
    .describe("User wallet address to include balance info"),
});

export const getVaultApySchema = z.object({
  address: z.string().describe("Vault contract address"),
});

export const getVaultNavSchema = z.object({
  address: z.string().describe("Vault contract address"),
});

export const getVaultTvlSchema = z.object({
  address: z.string().describe("Vault contract address"),
});

export const buildDepositTxSchema = z.object({
  userAddress: z.string().describe("Depositor wallet address"),
  vaultAddress: z.string().describe("Vault contract address"),
  depositTokenAddress: z.string().describe("Token address to deposit"),
  depositAmount: z
    .string()
    .describe("Amount to deposit (in token base units, as a string)"),
});

export const buildWithdrawTxSchema = z.object({
  userAddress: z.string().describe("Withdrawer wallet address"),
  vaultAddress: z.string().describe("Vault contract address"),
  oTokenAddress: z.string().describe("oToken (output token) address"),
  sharesToWithdraw: z
    .string()
    .describe("Number of vault shares to withdraw (as a string)"),
  slippage: z
    .string()
    .optional()
    .describe("Slippage tolerance (e.g. '0.01' for 1%)"),
});

export type ListVaultsParams = z.infer<typeof listVaultsSchema>;
export type GetVaultApyParams = z.infer<typeof getVaultApySchema>;
export type GetVaultNavParams = z.infer<typeof getVaultNavSchema>;
export type GetVaultTvlParams = z.infer<typeof getVaultTvlSchema>;
export type BuildDepositTxParams = z.infer<typeof buildDepositTxSchema>;
export type BuildWithdrawTxParams = z.infer<typeof buildWithdrawTxSchema>;
