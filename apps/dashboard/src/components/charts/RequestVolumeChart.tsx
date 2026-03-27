import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeBucket } from '../../types/analytics';

interface Props {
    data: TimeBucket[];
}

export function RequestVolumeChart({ data }: Props) {
    const formatted = data.map((d) => ({
        ...d,
        label: new Date(d.bucket).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Request Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        fill="#eef2ff"
                        name="Requests"
                    />
                    <Area
                        type="monotone"
                        dataKey="error_count"
                        stroke="#ef4444"
                        fill="#fef2f2"
                        name="Errors"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
