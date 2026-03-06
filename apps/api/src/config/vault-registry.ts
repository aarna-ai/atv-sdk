import { ALLOWED_VAULT_ID_SET } from "./env";
import { cmsService } from "../services/cms.service";
import { IAtvVault } from "../types/vault.types";

/**
 * Vault registry — the single source of truth for vault configs across this service.
 *
 * Data flow:
 *   Strapi CMS → strapiService (with TTL cache) → vaultRegistry (applies allowlist) → services
 *
 * Access control:
 *   Set ALLOWED_VAULT_IDS=atvUSDC,atvETH in your .env to restrict which vaults
 *   are exposed via this API. Leave empty to expose all vaults from Strapi.
 *   Changes take effect on the next cache refresh (default: 5 min) or server restart.
 *   For immediate effect, call vaultRegistry.invalidateCache().
 */
class VaultRegistry {
  /**
   * Returns the allowlist-filtered list of vaults.
   */
  async getVaults(): Promise<IAtvVault[]> {
    const all = await cmsService.getVaults();
    return this.applyAllowlist(all);
  }

  /**
   * Returns a map of lowercase afiTokenAddress → IAtvVault for O(1) lookup.
   */
  async getVaultMap(): Promise<Record<string, IAtvVault>> {
    const vaults = await this.getVaults();
    return Object.fromEntries(
      vaults.map((v) => [v.afiTokenAddress.toLowerCase(), v]),
    );
  }

  /**
   * Looks up a vault by its afiTokenAddress.
   * Throws a 404 ApiError if not found (or not in the allowlist).
   */
  async getVaultOrThrow(address: string): Promise<IAtvVault> {
    const map = await this.getVaultMap();
    const vault = map[address.toLowerCase()];
    if (!vault) {
      const err = new Error(`Vault not found: ${address}`) as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    return vault;
  }

  /**
   * Bust the Strapi cache immediately — useful after adding/updating vaults in the CMS.
   * No restart needed; the next request will re-fetch from Strapi.
   */
  invalidateCache(): void {
    cmsService.invalidateCache();
  }

  private applyAllowlist(vaults: IAtvVault[]): IAtvVault[] {
    if (ALLOWED_VAULT_ID_SET.size === 0) {
      return vaults; // no restriction — expose everything
    }
    return vaults.filter((v) => ALLOWED_VAULT_ID_SET.has(v.productId));
  }
}

export const vaultRegistry = new VaultRegistry();
