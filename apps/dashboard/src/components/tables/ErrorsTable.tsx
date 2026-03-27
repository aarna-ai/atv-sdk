import type { ErrorEntry } from '../../types/analytics';

interface Props {
    data: ErrorEntry[];
}

export function ErrorsTable({ data }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-5 py-3 text-gray-600 font-medium">Status Code</th>
                        <th className="text-left px-5 py-3 text-gray-600 font-medium">Route</th>
                        <th className="text-right px-5 py-3 text-gray-600 font-medium">Count</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        row.status_code >= 500
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                >
                                    {row.status_code}
                                </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-xs text-gray-800">{row.route ?? 'unknown'}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.count.toLocaleString()}</td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                                No errors in this period
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
