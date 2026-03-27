import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LatencyEntry } from '../../types/analytics';

interface Props {
    data: LatencyEntry[];
}

export function LatencyChart({ data }: Props) {
    const formatted = data.map((d) => ({
        ...d,
        route: d.route.replace('/v1/', ''),
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Latency Percentiles (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="route" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="p50" fill="#a5b4fc" name="p50" />
                    <Bar dataKey="p95" fill="#6366f1" name="p95" />
                    <Bar dataKey="p99" fill="#4338ca" name="p99" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
