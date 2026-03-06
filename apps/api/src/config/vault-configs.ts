/**
 * @deprecated Vault configurations are now loaded dynamically from Strapi CMS.
 *
 * Use `vaultRegistry` from `./vault-registry` to access vault data:
 *   - vaultRegistry.getVaults()           → Promise<IAtvVault[]>
 *   - vaultRegistry.getVaultMap()         → Promise<Record<string, IAtvVault>>
 *   - vaultRegistry.getVaultOrThrow(addr) → Promise<IAtvVault>  (throws 404 if not found)
 *
 * To control which vaults are exposed via this API:
 *   Set ALLOWED_VAULT_IDS=atvUSDC,atvETH in your .env (comma-separated productIds).
 *   Leave empty to expose all vaults from Strapi.
 *
 * The ABI files in ./abis/ are kept as a reference for the function signatures
 * this service relies on. Actual ABIs at runtime come from Strapi.
 */
export {};
