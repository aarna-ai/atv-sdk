import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { fetchNpmDownloads } from '../../api/analytics';

const PACKAGE = '@aarna-ai/mcp-server-atv';

interface TrendPoint {
    day: string;
    downloads: number;
}

interface State {
    total: number;
    monthly: number;
    weekly: number;
    trend: TrendPoint[];
    loading: boolean;
    error: string | null;
}

export function NpmDownloadsCard() {
    const [state, setState] = useState<State>({
        total: 0,
        monthly: 0,
        weekly: 0,
        trend: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchNpmDownloads();

                if (cancelled) return;

                const trend = (data.trend ?? []).map((d) => ({
                    day: new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    downloads: d.downloads,
                }));

                setState({
                    total: data.total,
                    monthly: data.monthly,
                    weekly: data.weekly,
                    trend,
                    loading: false,
                    error: null,
                });
            } catch (err) {
                if (!cancelled) {
                    setState((s) => ({ ...s, loading: false, error: (err as Error).message }));
                }
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {/* npm cube mark (Simple Icons) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-label="npm">
                        <path fill="#CB3837" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/>
                    </svg>
                    <h3 className="text-sm font-medium text-gray-700">Downloads</h3>
                </div>
                <span className="text-xs text-gray-400 font-mono">{PACKAGE}</span>
            </div>

            {state.loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
            ) : state.error ? (
                <p className="text-sm text-red-500">{state.error}</p>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-indigo-50 rounded-lg p-4">
                            <p className="text-xs text-indigo-500 mb-1">All Time</p>
                            <p className="text-2xl font-bold text-indigo-700">
                                {state.total.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Last 30 Days</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {state.monthly.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Last 7 Days</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {state.weekly.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {state.trend.length > 0 && (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={state.trend} barSize={8}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 10 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis tick={{ fontSize: 10 }} width={30} />
                                <Tooltip
                                    formatter={(v: number) => [v.toLocaleString(), 'Downloads']}
                                />
                                <Bar dataKey="downloads" fill="#6366f1" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </>
            )}
        </div>
    );
}
