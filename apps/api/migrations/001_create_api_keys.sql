-- Migration: 001_create_api_keys
-- API key management table for the ATV SDK monetizable API

CREATE TABLE IF NOT EXISTS api_keys (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(255)  NOT NULL,
    key_prefix            CHAR(8)       NOT NULL,
    key_hash              CHAR(64)      NOT NULL UNIQUE,
    tier                  VARCHAR(20)   NOT NULL DEFAULT 'free'
                              CHECK (tier IN ('free', 'pro', 'enterprise')),
    rate_limit_per_minute INTEGER       NOT NULL DEFAULT 60,
    is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_used_at          TIMESTAMPTZ,
    usage_count           BIGINT        NOT NULL DEFAULT 0
);

-- Primary lookup: incoming key hash → full record (hit on every authenticated request)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);

-- Admin queries: list active keys by tier
CREATE INDEX IF NOT EXISTS idx_api_keys_tier_active ON api_keys (tier, is_active);

COMMENT ON TABLE  api_keys IS 'API keys for ATV SDK external access';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 chars of raw key for display only — never the full key';
COMMENT ON COLUMN api_keys.key_hash   IS 'SHA256 hex of the raw key — used for all lookup operations';
COMMENT ON COLUMN api_keys.rate_limit_per_minute IS 'Denormalized from tier for fast rate-limit reads without a JOIN';
