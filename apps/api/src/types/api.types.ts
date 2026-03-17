import { DepositContractType, WithdrawType } from "./vault.types";

// --- Request DTOs (query params arrive as strings from Express) ---

export interface ListVaultsQuery {
  chain?: string;
  userAddress?: string; // if provided, token balances are included in depositTokens
}

export interface DepositTxQuery {
  userAddress: string;
  vaultAddress: string;
  depositTokenAddress: string;
  depositAmount: string; // human-readable amount, e.g. "100" = 100 USDC
}

export interface WithdrawTxQuery {
  userAddress: string;
  vaultAddress: string;
  oTokenAddress: string;
  sharesToWithdraw: string; // human-readable share amount, e.g. "100" = 100 shares
  slippage?: string; // percentage, e.g. "0.5"
  simulate?: string; // "true" | "false"
  metaInfo?: string; // "true" | "false"
}

// --- Response shapes ---

export interface DepositToken {
  name: string;
  address: string; // lowercase
  symbol: string;
  decimals: number;
  balance: string; // raw wei balance ("0" when no userAddress supplied)
  formattedBalance: string; // human-readable
  minDepositLimit: string; // in wei as string ("0" = no minimum)
  formattedMinDepositLimit: string; // human-readable
}

export interface VaultMetadata {
  productId: string;
  label: string;
  address: string;
  chain: string; // human-readable name, e.g. "Base", "Ethereum Mainnet"
  withdrawType: WithdrawType[];
  contractType: DepositContractType;
  depositTokens: DepositToken[];
}

export interface NavResponse {
  address: string;
  nav: string;
  formattedNav: string; // e.g. "1.04"
  decimals?: number; // 4 for standard vaults, 18 for leverage vaults
  currency: "USD";
}

export interface TvlResponse {
  address: string;
  tvl: string; // raw value, as string
  decimals: number; // decimal places of the raw tvl value (always 18)
  formattedTvl: string; // human-readable, 2 decimals, e.g. "5000000.00"
  currency: "USD";
}

export interface ApyResponse {
  address: string;
  baseApy: string; // native vault yield, e.g. "10.58"
  rewardApy: string; // on-top ASRT token reward APY, e.g. "10.58"
  totalApy: string; // baseApy + rewardApy, e.g. "21.16"
}

export interface VaultStatusResponse {
  isPaused: boolean;
  supported: boolean; // false when contract doesn't expose the status function
}

export interface StakeTxQuery {
  userAddress: string;
  vaultAddress: string;
  lockPeriodIndex: string; // 0-indexed lock period from the timelock contract
  stakeAmount: string; // human-readable vault token amount, e.g. "100"
}

export interface UnstakeTxQuery {
  userAddress: string;
  vaultAddress: string;
  stakeIndex: string; // 0-indexed position in the user's stake array
  unstakeAmount: string; // human-readable vault token amount
}

export interface QueueWithdrawTxQuery {
  userAddress: string;
  vaultAddress: string;
  tokensToWithdraw: string; // human-readable share amount
  withdrawTokenAddress: string; // output token to receive on redemption
}

export interface UnqueueWithdrawTxQuery {
  userAddress: string;
  vaultAddress: string;
  oTokenAddress: string; // output token address of the queued request
  requestId?: string; // optional specific request ID to cancel
}

export interface RedeemWithdrawTxQuery {
  userAddress: string;
  vaultAddress: string;
  oTokens: string; // human-readable amount of output tokens to redeem
  batchCounter: string; // batch identifier from the queue contract
}

export interface UserInvestmentsQuery {
  userAddress: string;
  vaultAddress?: string; // optional filter to a specific vault
}

export interface HistoricalNavQuery {
  days?: string; // number of days of history, defaults to 30
}

/**
 * The role of a transaction step within a multi-step operation.
 *
 * approve          — ERC20 allowance grant; safe to skip if sufficient allowance exists
 * deposit          — transfers tokens into a vault
 * withdraw         — redeems vault shares for an output token
 * stake            — locks vault tokens in a timelock/staking contract
 * unstake          — unlocks staked vault tokens
 * queue_withdraw   — initiates a queued (delayed) withdrawal request
 * unqueue_withdraw — cancels a pending queued withdrawal request
 * redeem_withdraw  — claims a completed queued withdrawal
 */
export enum TxStepType {
  Approve = "approve",
  Deposit = "deposit",
  Withdraw = "withdraw",
  Stake = "stake",
  Unstake = "unstake",
  QueueWithdraw = "queue_withdraw",
  UnqueueWithdraw = "unqueue_withdraw",
  RedeemWithdraw = "redeem_withdraw",
}

/**
 * A single transaction step ready to submit to the blockchain.
 *
 * Steps must be sent in ascending `step` order.
 * The `type` field lets clients programmatically handle each step
 * (e.g. skip `approve` if the user already has sufficient allowance).
 */
export interface TxStep {
  step: number; // execution order, 1-indexed
  label: string; // human-readable label for UI display
  type: TxStepType;
  to: string; // target contract address
  data: string; // ABI-encoded calldata
  value: string; // ETH value to send (always "0" for ERC20 vaults)
  from: string; // sender address — must sign the transaction
  chainId: number; // EVM chain ID (e.g. 8453 for Base)
}

// Standard API envelope
export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}
