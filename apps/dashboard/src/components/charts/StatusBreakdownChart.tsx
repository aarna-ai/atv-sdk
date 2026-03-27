import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { StatusBreakdown } from '../../types/analytics';

interface Props {
    data: StatusBreakdown[];
}

const STATUS_COLORS: Record<string, string> = {
    '2xx': '#22c55e',
    '3xx': '#3b82f6',
    '4xx': '#f59e0b',
    '5xx': '#ef4444',
};

export function StatusBreakdownChart({ data }: Props) {
    if (data.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Status Codes</h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={data} dataKey="count" nameKey="status_group" cx="50%" cy="50%" outerRadius={75} label>
                        {data.map((entry) => (
                            <Cell key={entry.status_group} fill={STATUS_COLORS[entry.status_group] ?? '#9ca3af'} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
