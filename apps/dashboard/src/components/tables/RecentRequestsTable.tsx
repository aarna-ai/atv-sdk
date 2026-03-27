import type { RecentRequest } from '../../types/analytics';

interface Props {
    data: RecentRequest[];
}

const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-purple-100 text-purple-700',
    DELETE: 'bg-red-100 text-red-700',
};

const statusColor = (code: number) => {
    if (code < 300) return 'text-green-600';
    if (code < 400) return 'text-blue-600';
    if (code < 500) return 'text-amber-600';
    return 'text-red-600';
};

export function RecentRequestsTable({ data }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Recent Requests</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0">
                        <tr>
                            <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Method</th>
                            <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Path</th>
                            <th className="text-center px-4 py-2 text-gray-500 font-medium text-xs">Status</th>
                            <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Latency</th>
                            <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Key</th>
                            <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((req, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${methodColors[req.method] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {req.method}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-gray-700 font-mono text-xs truncate max-w-[200px]">{req.path}</td>
                                <td className={`px-4 py-2 text-center font-medium text-xs ${statusColor(req.status_code)}`}>
                                    {req.status_code}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-600 text-xs">{req.response_time}ms</td>
                                <td className="px-4 py-2 text-gray-500 text-xs truncate max-w-[120px]">{req.api_key_name ?? '-'}</td>
                                <td className="px-4 py-2 text-right text-gray-400 text-xs whitespace-nowrap">
                                    {new Date(req.created_at).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No recent requests</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
