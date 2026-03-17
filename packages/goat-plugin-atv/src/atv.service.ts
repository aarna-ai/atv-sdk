import axios, { AxiosInstance } from "axios";

export class AtvService {
  private client: AxiosInstance;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.client = axios.create({
      baseURL: config.baseUrl ?? "https://atv-api.aarna.ai",
      headers: { "x-api-key": config.apiKey },
    });
  }

  async listVaults(params?: { chain?: string; userAddress?: string }) {
    const { data } = await this.client.get("/v1/vaults", { params });
    return data;
  }

  async getVaultNav(address: string) {
    const { data } = await this.client.get(`/v1/vaults/${address}/nav`);
    return data;
  }

  async getVaultTvl(address: string) {
    const { data } = await this.client.get(`/v1/vaults/${address}/tvl`);
    return data;
  }

  async getVaultApy(address: string) {
    const { data } = await this.client.get(`/v1/vaults/${address}/apy`);
    return data;
  }

  async buildDepositTx(params: {
    userAddress: string;
    vaultAddress: string;
    depositTokenAddress: string;
    depositAmount: string;
  }) {
    const { data } = await this.client.get("/v1/deposit-tx", { params });
    return data;
  }

  async buildWithdrawTx(params: {
    userAddress: string;
    vaultAddress: string;
    oTokenAddress: string;
    sharesToWithdraw: string;
    slippage?: string;
  }) {
    const { data } = await this.client.get("/v1/withdraw-tx", { params });
    return data;
  }
}
