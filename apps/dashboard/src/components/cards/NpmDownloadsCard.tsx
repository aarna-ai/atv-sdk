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

const PACKAGE = '@aarna-ai/mcp-server-atv';
const TODAY = new Date().toISOString().slice(0, 10);
const NPM_BASE = 'https://api.npmjs.org/downloads';

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
                const [rangeRes, monthlyRes, weeklyRes] = await Promise.all([
                    fetch(`${NPM_BASE}/range/2000-01-01:${TODAY}/${PACKAGE}`),
                    fetch(`${NPM_BASE}/point/last-month/${PACKAGE}`),
                    fetch(`${NPM_BASE}/point/last-week/${PACKAGE}`),
                ]);

                if (!rangeRes.ok || !monthlyRes.ok || !weeklyRes.ok) {
                    throw new Error('npm registry request failed');
                }

                const [rangeData, monthlyData, weeklyData] = await Promise.all([
                    rangeRes.json(),
                    monthlyRes.json(),
                    weeklyRes.json(),
                ]);

                if (cancelled) return;

                const allDownloads: TrendPoint[] = rangeData.downloads ?? [];
                const total = allDownloads.reduce((sum, d) => sum + d.downloads, 0);
                const trend = allDownloads.slice(-30).map((d) => ({
                    day: new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    downloads: d.downloads,
                }));

                setState({
                    total,
                    monthly: monthlyData.downloads ?? 0,
                    weekly: weeklyData.downloads ?? 0,
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
                    {/* npm logo */}
                    <svg width="32" height="12" viewBox="0 0 780 304" xmlns="http://www.w3.org/2000/svg" aria-label="npm">
                        <path fill="#CB3837" d="M0 0h780v240H0z"/>
                        <path fill="#fff" d="M240 0h300v240H360V60h-60v180H240zM0 0h240v240H60V60H0zM60 60h60v120h60V60h60v180H60zM480 0h300v240H600V60h-60v180H480z"/>
                        <path fill="#CB3837" d="M540 60h60v120h60V60h60v180H540z"/>
                        <path fill="#fff" d="M0 242h780v62H0z"/>
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
