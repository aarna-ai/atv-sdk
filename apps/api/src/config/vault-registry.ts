import { cmsService } from "../services/cms.service";
import { pool } from "../db/postgres";
import { IAtvVault } from "../types/vault.types";

/**
 * Vault registry — the single source of truth for vault configs across this service.
 *
 * Data flow:
 *   Strapi CMS → cmsService (TTL cache) → vaultRegistry (DB allowlist) → services
 *
 * Access control:
 *   Vault visibility is controlled by the `vault_allowlist` table in PostgreSQL.
 *   New vaults from Strapi are auto-inserted with is_allowed = FALSE.
 *   Enable a vault: UPDATE vault_allowlist SET is_allowed = TRUE WHERE product_id = '...';
 *   Changes take effect within STRAPI_CACHE_TTL_MS, or immediately via invalidateCache().
 */
class VaultRegistry {
  /**
   * Returns the DB-allowlist-filtered list of vaults.
   * Also auto-inserts any new vaults from Strapi into the allowlist table (is_allowed = FALSE).
   */
  async getVaults(): Promise<IAtvVault[]> {
    const all = await cmsService.getVaults();
    await this.syncNewVaults(all);
    const allowed = await this.getAllowedProductIds();
    return all.filter((v) => allowed.has(v.productId));
  }

  /**
   * Returns a map of lowercase atvTokenAddress → IAtvVault for O(1) lookup.
   */
  async getVaultMap(): Promise<Record<string, IAtvVault>> {
    const vaults = await this.getVaults();
    return Object.fromEntries(
      vaults.map((v) => [v.atvTokenAddress.toLowerCase(), v]),
    );
  }

  /**
   * Looks up a vault by its atvTokenAddress.
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

  /**
   * Inserts any vault not yet present in vault_allowlist.
   * Existing rows are untouched (ON CONFLICT DO NOTHING), so is_allowed flags are preserved.
   */
  private async syncNewVaults(vaults: IAtvVault[]): Promise<void> {
    if (vaults.length === 0) return;
    const client = await pool.connect();
    try {
      for (const v of vaults) {
        await client.query(
          `INSERT INTO vault_allowlist (product_id, label)
           VALUES ($1, $2)
           ON CONFLICT (product_id) DO NOTHING`,
          [v.productId, v.label],
        );
      }
    } finally {
      client.release();
    }
  }

  /**
   * Returns the set of product_ids that have is_allowed = TRUE in the DB.
   */
  private async getAllowedProductIds(): Promise<Set<string>> {
    const { rows } = await pool.query<{ product_id: string }>(
      `SELECT product_id FROM vault_allowlist WHERE is_allowed = TRUE`,
    );
    return new Set(rows.map((r) => r.product_id));
  }
}

export const vaultRegistry = new VaultRegistry();
