import { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { useAnalytics } from '../hooks/useAnalytics';
import { fetchTopVaults, fetchTxFunnel, fetchChannelSplit } from '../api/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { Period } from '../types/analytics';

const CHANNEL_COLORS: Record<string, string> = {
    REST: '#6366f1',
    MCP: '#22c55e',
    Other: '#9ca3af',
};

const TX_COLORS: Record<string, string> = {
    Deposit: '#22c55e',
    Withdraw: '#f59e0b',
    Stake: '#6366f1',
    Unstake: '#8b5cf6',
    'Queue Withdraw': '#3b82f6',
    'Unqueue Withdraw': '#ef4444',
    'Redeem Withdraw': '#14b8a6',
};

export function DefiInsightsPage() {
    const [period, setPeriod] = useState<Period>('30d');

    const vaults = useAnalytics(useCallback(() => fetchTopVaults(period), [period]));
    const funnel = useAnalytics(useCallback(() => fetchTxFunnel(period), [period]));
    const channels = useAnalytics(useCallback(() => fetchChannelSplit(period), [period]));

    const channelTotal = (channels.data ?? []).reduce((s, c) => s + c.request_count, 0);

    return (
        <div>
            <Header title="DeFi Insights" period={period} onPeriodChange={setPeriod} />

            {/* MCP vs REST Split */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">MCP vs REST</h3>
                    {channels.loading ? (
                        <p className="text-gray-400 text-sm">Loading...</p>
                    ) : channels.data && channels.data.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={channels.data.filter((c) => c.channel !== 'Other')}
                                        dataKey="request_count"
                                        nameKey="channel"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {channels.data
                                            .filter((c) => c.channel !== 'Other')
                                            .map((entry) => (
                                                <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? '#9ca3af'} />
                                            ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-3">
                                {channels.data.map((ch) => (
                                    <div key={ch.channel} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: CHANNEL_COLORS[ch.channel] ?? '#9ca3af' }}
                                            />
                                            <span className="text-gray-700 font-medium">{ch.channel}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-900 font-semibold">{ch.request_count.toLocaleString()}</span>
                                            <span className="text-gray-400 ml-1.5 text-xs">
                                                ({channelTotal > 0 ? ((ch.request_count / channelTotal) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-400 text-sm py-8 text-center">No data for this period</p>
                    )}
                </div>

                {/* Channel details cards */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    {channels.data?.filter((c) => c.channel !== 'Other').map((ch) => (
                        <div key={ch.channel} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: CHANNEL_COLORS[ch.channel] }}
                                />
                                <h4 className="text-sm font-semibold text-gray-800">{ch.channel} API</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Requests</p>
                                    <p className="text-lg font-bold text-gray-900">{ch.request_count.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Unique Keys</p>
                                    <p className="text-lg font-bold text-gray-900">{ch.unique_keys}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Error Rate</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {ch.request_count > 0 ? ((ch.error_count / ch.request_count) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Avg Latency</p>
                                    <p className="text-lg font-bold text-gray-900">{ch.avg_response_time_ms}ms</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction Build Funnel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Transaction Build Funnel</h3>
                {funnel.loading ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                ) : funnel.data && funnel.data.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={funnel.data} margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="tx_type" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="successful_builds" name="Successful" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed_builds" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        {/* Summary table */}
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Transaction Type</th>
                                        <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Total Builds</th>
                                        <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Successful</th>
                                        <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Failed</th>
                                        <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Success Rate</th>
                                        <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Unique Keys</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {funnel.data.map((row) => (
                                        <tr key={row.tx_type} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 font-medium text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: TX_COLORS[row.tx_type] ?? '#9ca3af' }}
                                                    />
                                                    {row.tx_type}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-700">{row.total_builds}</td>
                                            <td className="px-4 py-2.5 text-right text-green-600">{row.successful_builds}</td>
                                            <td className="px-4 py-2.5 text-right text-red-600">{row.failed_builds}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-700">
                                                {row.total_builds > 0
                                                    ? ((row.successful_builds / row.total_builds) * 100).toFixed(1)
                                                    : 0}%
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-gray-500">{row.unique_keys}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-400 text-sm py-8 text-center">No transaction builds in this period</p>
                )}
            </div>

            {/* Most Queried Vaults */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Most Queried Vaults</h3>
                {vaults.loading ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                ) : vaults.data && vaults.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">#</th>
                                    <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Vault Address</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Queries</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Unique Keys</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Endpoints Hit</th>
                                    <th className="text-right px-4 py-2 text-gray-500 font-medium text-xs">Avg Latency</th>
                                    <th className="text-left px-4 py-2 text-gray-500 font-medium text-xs">Popularity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vaults.data.map((v, i) => {
                                    const maxCount = vaults.data?.[0]?.query_count ?? 1;
                                    const pct = maxCount > 0 ? (v.query_count / maxCount) * 100 : 0;
                                    return (
                                        <tr key={v.vault_address} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                                                {v.vault_address.slice(0, 6)}...{v.vault_address.slice(-4)}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{v.query_count}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{v.unique_keys}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{v.unique_endpoints}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-600">{v.avg_response_time_ms}ms</td>
                                            <td className="px-4 py-2.5 w-40">
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm py-8 text-center">No vault queries in this period</p>
                )}
            </div>
        </div>
    );
}
