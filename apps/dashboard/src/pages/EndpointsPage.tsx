import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { EndpointsTable } from '../components/tables/EndpointsTable';
import { LatencyChart } from '../components/charts/LatencyChart';
import { useAnalytics } from '../hooks/useAnalytics';
import { fetchTopEndpoints, fetchLatency } from '../api/analytics';
import type { Period } from '../types/analytics';

export function EndpointsPage() {
    const [period, setPeriod] = useState<Period>('24h');

    const endpoints = useAnalytics(useCallback(() => fetchTopEndpoints(period), [period]));
    const latency = useAnalytics(useCallback(() => fetchLatency(period), [period]));

    return (
        <div>
            <Header title="Endpoints" period={period} onPeriodChange={setPeriod} />

            {endpoints.loading ? (
                <p className="text-gray-400">Loading...</p>
            ) : endpoints.error ? (
                <p className="text-red-500">{endpoints.error}</p>
            ) : (
                <div className="space-y-6">
                    {endpoints.data && <EndpointsTable data={endpoints.data} />}
                    {latency.data && <LatencyChart data={latency.data} />}
                </div>
            )}
        </div>
    );
}
