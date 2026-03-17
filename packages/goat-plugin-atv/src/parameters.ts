import { z } from "zod";

export const listVaultsParameters = z.object({
  chain: z
    .string()
    .optional()
    .describe("Filter by chain name (e.g. ethereum, base)"),
  userAddress: z
    .string()
    .optional()
    .describe("User wallet address to include user-specific balances"),
});

export const getVaultNavParameters = z.object({
  address: z.string().describe("The vault contract address"),
});

export const getVaultTvlParameters = z.object({
  address: z.string().describe("The vault contract address"),
});

export const getVaultApyParameters = z.object({
  address: z.string().describe("The vault contract address"),
});

export const buildDepositTxParameters = z.object({
  userAddress: z.string().describe("The depositor wallet address"),
  vaultAddress: z.string().describe("The vault contract address"),
  depositTokenAddress: z
    .string()
    .describe("The ERC-20 token address to deposit"),
  depositAmount: z
    .string()
    .describe("The amount to deposit (in token decimals, as a string)"),
});

export const buildWithdrawTxParameters = z.object({
  userAddress: z.string().describe("The withdrawer wallet address"),
  vaultAddress: z.string().describe("The vault contract address"),
  oTokenAddress: z.string().describe("The oToken (vault share) address"),
  sharesToWithdraw: z
    .string()
    .describe("The number of shares to withdraw (as a string)"),
  slippage: z
    .string()
    .optional()
    .describe("Slippage tolerance as a decimal string (e.g. '0.01' for 1%)"),
});
