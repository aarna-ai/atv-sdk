import api from './client';
import type {
    Overview,
    TimeBucket,
    TopEndpoint,
    ApiKeyUsage,
    ErrorEntry,
    LatencyEntry,
    Period,
    ApiKeyRecord,
    StatusBreakdown,
    UserAgentBreakdown,
    RecentRequest,
    TopVault,
    TxFunnelEntry,
    ChannelSplit,
} from '../types/analytics';

export const fetchOverview = (period: Period) =>
    api.get<Overview>('/admin/analytics/overview', { params: { period } }).then((r) => r.data);

export const fetchRequestsOverTime = (period: Period) =>
    api.get<TimeBucket[]>('/admin/analytics/requests-over-time', { params: { period } }).then((r) => r.data);

export const fetchTopEndpoints = (period: Period) =>
    api.get<TopEndpoint[]>('/admin/analytics/top-endpoints', { params: { period } }).then((r) => r.data);

export const fetchApiKeys = (period: Period) =>
    api.get<ApiKeyUsage[]>('/admin/analytics/api-keys', { params: { period } }).then((r) => r.data);

export const fetchErrors = (period: Period) =>
    api.get<ErrorEntry[]>('/admin/analytics/errors', { params: { period } }).then((r) => r.data);

export const fetchLatency = (period: Period) =>
    api.get<LatencyEntry[]>('/admin/analytics/latency', { params: { period } }).then((r) => r.data);

// API key management
export const fetchAllApiKeys = () =>
    api.get<ApiKeyRecord[]>('/admin/api-keys').then((r) => r.data);

export const createApiKey = (name: string, tier: string) =>
    api.post<ApiKeyRecord & { raw_key: string }>('/admin/api-keys', { name, tier }).then((r) => r.data);

export const toggleApiKey = (id: number) =>
    api.patch<{ id: number; name: string; is_active: boolean }>(`/admin/api-keys/${id}/toggle`).then((r) => r.data);

export const deleteApiKey = (id: number) =>
    api.delete(`/admin/api-keys/${id}`).then((r) => r.data);

// Additional analytics
export const fetchStatusBreakdown = (period: Period) =>
    api.get<StatusBreakdown[]>('/admin/analytics/status-breakdown', { params: { period } }).then((r) => r.data);

export const fetchUserAgents = (period: Period) =>
    api.get<UserAgentBreakdown[]>('/admin/analytics/user-agents', { params: { period } }).then((r) => r.data);

export const fetchRecentRequests = (limit?: number) =>
    api.get<RecentRequest[]>('/admin/analytics/recent', { params: { limit } }).then((r) => r.data);

// NPM download stats
export const fetchNpmDownloads = () =>
    api.get<{ total: number; monthly: number; weekly: number; trend: { downloads: number; day: string }[] }>(
        '/admin/analytics/npm-downloads',
    ).then((r) => r.data);

// DeFi-specific analytics
export const fetchTopVaults = (period: Period) =>
    api.get<TopVault[]>('/admin/analytics/top-vaults', { params: { period } }).then((r) => r.data);

export const fetchTxFunnel = (period: Period) =>
    api.get<TxFunnelEntry[]>('/admin/analytics/tx-funnel', { params: { period } }).then((r) => r.data);

export const fetchChannelSplit = (period: Period) =>
    api.get<ChannelSplit[]>('/admin/analytics/channel-split', { params: { period } }).then((r) => r.data);
