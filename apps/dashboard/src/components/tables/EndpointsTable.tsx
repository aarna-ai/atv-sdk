import type { TopEndpoint } from '../../types/analytics';

interface Props {
    data: TopEndpoint[];
}

export function EndpointsTable({ data }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-5 py-3 text-gray-600 font-medium">Route</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Requests</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Avg Latency</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Error Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row) => (
                        <tr key={row.route} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-mono text-xs text-gray-800">{row.route}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.count.toLocaleString()}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.avg_response_time_ms}ms</td>
                            <td className="px-5 py-3 text-right">
                                <span
                                    className={`${
                                        parseFloat(row.error_rate) > 5 ? 'text-red-600' : 'text-gray-500'
                                    }`}
                                >
                                    {row.error_rate}%
                                </span>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                                No data for this period
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
