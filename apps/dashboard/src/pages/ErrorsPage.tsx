import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { ErrorsTable } from '../components/tables/ErrorsTable';
import { useAnalytics } from '../hooks/useAnalytics';
import { fetchErrors } from '../api/analytics';
import type { Period } from '../types/analytics';

export function ErrorsPage() {
    const [period, setPeriod] = useState<Period>('24h');

    const errors = useAnalytics(useCallback(() => fetchErrors(period), [period]));

    return (
        <div>
            <Header title="Errors" period={period} onPeriodChange={setPeriod} />

            {errors.loading ? (
                <p className="text-gray-400">Loading...</p>
            ) : errors.error ? (
                <p className="text-red-500">{errors.error}</p>
            ) : errors.data ? (
                <ErrorsTable data={errors.data} />
            ) : null}
        </div>
    );
}
