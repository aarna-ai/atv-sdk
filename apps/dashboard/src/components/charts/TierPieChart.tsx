import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ApiKeyUsage } from '../../types/analytics';

interface Props {
    data: ApiKeyUsage[];
}

const TIER_COLORS: Record<string, string> = {
    free: '#a5b4fc',
    pro: '#6366f1',
    enterprise: '#4338ca',
};

export function TierPieChart({ data }: Props) {
    const byTier = data.reduce<Record<string, number>>((acc, d) => {
        acc[d.tier] = (acc[d.tier] ?? 0) + d.request_count;
        return acc;
    }, {});

    const chartData = Object.entries(byTier).map(([tier, value]) => ({
        name: tier,
        value,
    }));

    if (chartData.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Requests by Tier</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.map((entry) => (
                            <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#9ca3af'} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
