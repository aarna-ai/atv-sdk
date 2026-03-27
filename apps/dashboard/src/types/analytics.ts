export interface Overview {
    total_requests: number;
    active_keys: number;
    total_keys: number;
    error_count: number;
    avg_response_time_ms: number;
}

export interface TimeBucket {
    bucket: string;
    count: number;
    error_count: number;
}

export interface TopEndpoint {
    route: string;
    count: number;
    avg_response_time_ms: number;
    error_rate: string;
}

export interface ApiKeyUsage {
    api_key_id: number;
    api_key_name: string;
    tier: string;
    request_count: number;
    error_count: number;
    avg_response_time_ms: number;
    last_request_at: string;
}

export interface ErrorEntry {
    status_code: number;
    route: string;
    count: number;
}

export interface LatencyEntry {
    route: string;
    p50: number;
    p95: number;
    p99: number;
    sample_count: number;
}

export interface ApiKeyRecord {
    id: number;
    name: string;
    key_prefix: string;
    tier: string;
    rate_limit_per_minute: number;
    is_active: boolean;
    usage_count: number;
    created_at: string;
    last_used_at: string | null;
}

export interface StatusBreakdown {
    status_group: string;
    count: number;
}

export interface UserAgentBreakdown {
    category: string;
    count: number;
}

export interface RecentRequest {
    method: string;
    path: string;
    route: string;
    status_code: number;
    response_time: number;
    api_key_name: string;
    tier: string;
    ip_address: string;
    created_at: string;
}

export interface TopVault {
    vault_address: string;
    query_count: number;
    unique_keys: number;
    unique_endpoints: number;
    avg_response_time_ms: number;
}

export interface TxFunnelEntry {
    tx_type: string;
    total_builds: number;
    successful_builds: number;
    failed_builds: number;
    unique_keys: number;
}

export interface ChannelSplit {
    channel: string;
    request_count: number;
    unique_keys: number;
    error_count: number;
    avg_response_time_ms: number;
}

export type Period = '24h' | '7d' | '30d';
