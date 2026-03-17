import axios, { AxiosInstance } from "axios";
import type {
  ListVaultsParams,
  GetVaultApyParams,
  GetVaultNavParams,
  GetVaultTvlParams,
  BuildDepositTxParams,
  BuildWithdrawTxParams,
} from "./schemas";

export interface AtvActionProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export class AtvActionProvider {
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;

  constructor(config: AtvActionProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://atv-api.aarna.ai";
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { "x-api-key": this.apiKey },
    });
  }

  private async request<T = unknown>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  /**
   * List available ATV DeFi yield vaults.
   * Optionally filter by chain or include user balance info.
   */
  async listVaults(params?: ListVaultsParams): Promise<unknown> {
    const query: Record<string, string> = {};
    if (params?.chain) query.chain = params.chain;
    if (params?.userAddress) query.userAddress = params.userAddress;
    return this.request("/v1/vaults", query);
  }

  /**
   * Get the current APY for a specific vault.
   */
  async getVaultApy(params: GetVaultApyParams): Promise<unknown> {
    return this.request(`/v1/vaults/${params.address}/apy`);
  }

  /**
   * Get the current NAV (Net Asset Value) price for a specific vault.
   */
  async getVaultNav(params: GetVaultNavParams): Promise<unknown> {
    return this.request(`/v1/vaults/${params.address}/nav`);
  }

  /**
   * Get the current TVL (Total Value Locked) for a specific vault.
   */
  async getVaultTvl(params: GetVaultTvlParams): Promise<unknown> {
    return this.request(`/v1/vaults/${params.address}/tvl`);
  }

  /**
   * Build a deposit transaction (returns approve + deposit calldata).
   * The consumer must send the transactions in order.
   */
  async buildDepositTx(params: BuildDepositTxParams): Promise<unknown> {
    return this.request("/v1/deposit-tx", {
      userAddress: params.userAddress,
      vaultAddress: params.vaultAddress,
      depositTokenAddress: params.depositTokenAddress,
      depositAmount: params.depositAmount,
    });
  }

  /**
   * Build a withdraw transaction for a vault.
   */
  async buildWithdrawTx(params: BuildWithdrawTxParams): Promise<unknown> {
    const query: Record<string, string> = {
      userAddress: params.userAddress,
      vaultAddress: params.vaultAddress,
      oTokenAddress: params.oTokenAddress,
      sharesToWithdraw: params.sharesToWithdraw,
    };
    if (params.slippage) query.slippage = params.slippage;
    return this.request("/v1/withdraw-tx", query);
  }
}
