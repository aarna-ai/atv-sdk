-- Migration: 003_create_request_logs
-- Per-request audit log for the analytics dashboard

CREATE TABLE IF NOT EXISTS request_logs (
    id              BIGSERIAL       PRIMARY KEY,
    api_key_id      INTEGER         REFERENCES api_keys(id),
    api_key_name    VARCHAR(255),
    tier            VARCHAR(20),
    method          VARCHAR(10)     NOT NULL,
    path            VARCHAR(512)    NOT NULL,
    route           VARCHAR(256),
    status_code     SMALLINT        NOT NULL,
    response_time   INTEGER         NOT NULL,
    user_agent      VARCHAR(512),
    ip_address      INET,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Time-series aggregation over recent data
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at
    ON request_logs (created_at DESC);

-- Per-key breakdown queries
CREATE INDEX IF NOT EXISTS idx_request_logs_api_key_created
    ON request_logs (api_key_id, created_at DESC);

-- Error rate queries by endpoint
CREATE INDEX IF NOT EXISTS idx_request_logs_route_status
    ON request_logs (route, status_code, created_at DESC);

COMMENT ON TABLE  request_logs IS 'Per-request audit log for analytics dashboard. Rows older than 90 days are pruned by a scheduled cleanup query.';
COMMENT ON COLUMN request_logs.route IS 'Matched Express route pattern, e.g. /v1/vaults/:address/nav';
COMMENT ON COLUMN request_logs.response_time IS 'Response time in milliseconds';
