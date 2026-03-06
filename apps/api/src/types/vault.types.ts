import { EvmChain } from "@moralisweb3/common-evm-utils";
export { EvmChain };

export enum ProductId {
  atv802       = "a_fi_802",
  atv808       = "a_fi_808",
  atv111Sonic  = "a_fi_111_sonic",
  atv111Arb    = "a_fi_111_arb",
  atv111Monad  = "a_fi_111_monad",
  atv401       = "a_fi_401_arb",
  atvUSDC      = "a_fi_USDC",
  atvPTmax     = "a_fi_PTmax",
  atvBTC       = "a_fi_BTC",
  atvYieldMax  = "a_fi_YieldMax",
  atvUSDCBase  = "a_fi_USDC_base",
}

export type TLContractType = "STANDARD" | "BOOSTED" | "NONE";

export enum DepositContractType {
  ERC20 = "ERC20",
  ERC4626 = "ERC4626",
}

export enum WithdrawType {
  INSTANT = "INSTANT",
  STANDARD = "STANDARD",
  STANDARD_AUTO_REDEEM = "STANDARD_AUTO_REDEEM",
}

export type Tier = "free" | "pro" | "enterprise";

export const TIER_RATE_LIMITS: Record<Tier, number> = {
  free: 60,
  pro: 300,
  enterprise: 1000,
};

export interface IContractEntry {
  address: string;
  abi: string[]; // human-readable ABI fragments
}

export interface IAtvVault {
  productId: ProductId;
  label: string;
  afiTokenAddress: string;
  chain: EvmChain;
  productType: number;
  timelockContractType: TLContractType;
  depositContractType: DepositContractType;
  withdrawType: WithdrawType[];
  depositFee?: number;
  contracts: {
    base: IContractEntry;
    factory: IContractEntry;
    storage: IContractEntry;
    timelock?: IContractEntry;
  };
}

export interface ApiKeyRecord {
  id: number;
  name: string;
  key_prefix: string;
  key_hash: string;
  tier: Tier;
  rate_limit_per_minute: number;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  last_used_at: Date | null;
}

// Augment Express Request to carry the resolved key record
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyRecord;
    }
  }
}
