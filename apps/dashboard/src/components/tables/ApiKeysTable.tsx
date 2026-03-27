import type { ApiKeyUsage } from '../../types/analytics';

interface Props {
    data: ApiKeyUsage[];
}

const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-purple-100 text-purple-700',
};

export function ApiKeysTable({ data }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-5 py-3 text-gray-600 font-medium">Name</th>
                        <th className="text-left px-5 py-3 text-gray-600 font-medium">Tier</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Requests</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Errors</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Avg Latency</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Last Active</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row) => (
                        <tr key={row.api_key_id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 text-gray-800 font-medium">{row.api_key_name}</td>
                            <td className="px-5 py-3">
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        tierColors[row.tier] ?? 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {row.tier}
                                </span>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-700">
                                {row.request_count.toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right">
                                <span className={row.error_count > 0 ? 'text-red-600' : 'text-gray-500'}>
                                    {row.error_count}
                                </span>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.avg_response_time_ms}ms</td>
                            <td className="px-5 py-3 text-right text-gray-500 text-xs">
                                {new Date(row.last_request_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                                No data for this period
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
