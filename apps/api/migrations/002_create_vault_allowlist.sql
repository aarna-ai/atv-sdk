-- Migration: 002_create_vault_allowlist
-- Controls which vaults are exposed via this API.
-- New vaults from Strapi are auto-inserted with is_allowed = FALSE
-- and must be explicitly enabled via UPDATE.

CREATE TABLE IF NOT EXISTS vault_allowlist (
    product_id  TEXT        PRIMARY KEY,
    label       TEXT        NOT NULL,
    is_allowed  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  vault_allowlist IS 'Per-vault visibility control. Rows are auto-inserted when new vaults appear in Strapi; set is_allowed = TRUE to expose a vault via the API.';
COMMENT ON COLUMN vault_allowlist.product_id  IS 'Matches IAtvVault.productId, e.g. "a_fi_USDC"';
COMMENT ON COLUMN vault_allowlist.is_allowed  IS 'FALSE = hidden from API consumers, TRUE = visible';
