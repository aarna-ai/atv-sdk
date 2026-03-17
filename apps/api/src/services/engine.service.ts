import { env } from "../config/env";

/**
 * HTTP client for the Aarna engine API (https://engine.aarna.ai/api/v2).
 *
 * Generic get<T> handles auth, error handling, and query params.
 * Add typed methods here as new engine endpoints are consumed.
 */
class EngineService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.ENGINE_API_BASE_URL;
  }

  private async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err: any) {
      throw new Error(
        `Failed to reach engine API at ${url}: ${err.message}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Engine API returned HTTP ${response.status} for ${url}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * GET /afi/apy?vault_address=<address>
   * Returns base, reward (boosted), and total APY as 2-decimal percentage strings.
   */
  async getVaultApy(
    vaultAddress: string,
  ): Promise<{ baseApy: string; rewardApy: string; totalApy: string }> {
    const { data } = await this.get<{
      data: { baseAPY: number; boostedAPY: number };
    }>("/afi/apy", { vault_address: vaultAddress });

    const base = parseFloat(String(data.baseAPY));
    const reward = parseFloat(String(data.boostedAPY));
    return {
      baseApy: base.toFixed(2),
      rewardApy: reward.toFixed(2),
      totalApy: (base + reward).toFixed(2),
    };
  }

  /**
   * GET /afi/vault-balance-data?vaultAddress=<address>
   * Returns the underlying token breakdown for the vault.
   */
  async getVaultBalance(vaultAddress: string): Promise<unknown> {
    return this.get("/afi/vault-balance-data", { vaultAddress });
  }

  /**
   * GET /afi/user-investments?address=<addr>&vaultAddress=<addr>
   * Returns user portfolio / position data, optionally filtered to one vault.
   */
  async getUserInvestments(
    userAddress: string,
    vaultAddress?: string,
  ): Promise<unknown> {
    const params: Record<string, string> = { address: userAddress };
    if (vaultAddress) params.vaultAddress = vaultAddress;
    return this.get("/afi/user-investments", params);
  }

  /**
   * GET /afi/historical-nav-graph?vaultAddress=<addr>&days=<n>
   * Returns NAV data points over the requested number of days.
   */
  async getHistoricalNav(vaultAddress: string, days: number): Promise<unknown> {
    return this.get("/afi/historical-nav-graph", {
      vaultAddress,
      days: days.toString(),
    });
  }

  /**
   * GET /afi/total-tvl?vault_address=<addr>
   * Returns platform-wide or per-vault TVL from the engine DB.
   */
  async getTotalTvl(vaultAddress?: string): Promise<unknown> {
    const params: Record<string, string> = {};
    if (vaultAddress) params.vault_address = vaultAddress;
    return this.get("/afi/total-tvl", params);
  }
}

export const engineService = new EngineService();
