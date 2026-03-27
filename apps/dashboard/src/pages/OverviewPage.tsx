import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/cards/StatCard';
import { RequestVolumeChart } from '../components/charts/RequestVolumeChart';
import { StatusBreakdownChart } from '../components/charts/StatusBreakdownChart';
import { UserAgentChart } from '../components/charts/UserAgentChart';
import { RecentRequestsTable } from '../components/tables/RecentRequestsTable';
import { useAnalytics } from '../hooks/useAnalytics';
import {
    fetchOverview,
    fetchRequestsOverTime,
    fetchStatusBreakdown,
    fetchUserAgents,
    fetchRecentRequests,
} from '../api/analytics';
import type { Period } from '../types/analytics';

export function OverviewPage() {
    const [period, setPeriod] = useState<Period>('24h');

    const overview = useAnalytics(useCallback(() => fetchOverview(period), [period]));
    const timeSeries = useAnalytics(useCallback(() => fetchRequestsOverTime(period), [period]));
    const statusBreakdown = useAnalytics(useCallback(() => fetchStatusBreakdown(period), [period]));
    const userAgents = useAnalytics(useCallback(() => fetchUserAgents(period), [period]));
    const recentRequests = useAnalytics(useCallback(() => fetchRecentRequests(50), []));

    const errorRate =
        overview.data && overview.data.total_requests > 0
            ? ((overview.data.error_count / overview.data.total_requests) * 100).toFixed(1)
            : '0';

    const successRate =
        overview.data && overview.data.total_requests > 0
            ? (100 - parseFloat(errorRate)).toFixed(1)
            : '100';

    return (
        <div>
            <Header title="Overview" period={period} onPeriodChange={setPeriod} />

            {overview.loading ? (
                <p className="text-gray-400">Loading...</p>
            ) : overview.error ? (
                <p className="text-red-500">{overview.error}</p>
            ) : overview.data ? (
                <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <StatCard
                            label="Total Requests"
                            value={overview.data.total_requests.toLocaleString()}
                        />
                        <StatCard
                            label="API Keys"
                            value={`${overview.data.active_keys} / ${overview.data.total_keys}`}
                            sub={`${overview.data.active_keys} active in period, ${overview.data.total_keys} registered`}
                        />
                        <StatCard label="Success Rate" value={`${successRate}%`} />
                        <StatCard label="Error Rate" value={`${errorRate}%`} />
                        <StatCard
                            label="Avg Latency"
                            value={`${overview.data.avg_response_time_ms ?? 0}ms`}
                        />
                    </div>

                    {/* Request volume chart */}
                    {timeSeries.data && <RequestVolumeChart data={timeSeries.data} />}

                    {/* Status breakdown + User agents side by side */}
                    <div className="grid grid-cols-2 gap-6 mt-6">
                        {statusBreakdown.data && <StatusBreakdownChart data={statusBreakdown.data} />}
                        {userAgents.data && <UserAgentChart data={userAgents.data} />}
                    </div>

                    {/* Recent requests feed */}
                    <div className="mt-6">
                        {recentRequests.data && <RecentRequestsTable data={recentRequests.data} />}
                    </div>
                </>
            ) : null}
        </div>
    );
}
