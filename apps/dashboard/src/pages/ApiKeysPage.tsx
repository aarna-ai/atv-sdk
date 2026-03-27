import { useState, useCallback, useEffect } from 'react';
import { TierPieChart } from '../components/charts/TierPieChart';
import { CreateApiKeyDialog } from '../components/dialogs/CreateApiKeyDialog';
import { useToast } from '../components/ui/Toast';
import { useAnalytics } from '../hooks/useAnalytics';
import { fetchApiKeys, fetchAllApiKeys, toggleApiKey, deleteApiKey } from '../api/analytics';
import type { Period, ApiKeyRecord } from '../types/analytics';

const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-purple-100 text-purple-700',
};

export function ApiKeysPage() {
    const { toast } = useToast();
    const [period, setPeriod] = useState<Period>('24h');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [allKeys, setAllKeys] = useState<ApiKeyRecord[]>([]);
    const [keysLoading, setKeysLoading] = useState(true);
    const [keysError, setKeysError] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const usage = useAnalytics(useCallback(() => fetchApiKeys(period), [period]));

    const usageMap = new Map(
        (usage.data ?? []).map((u) => [u.api_key_id, u]),
    );

    const loadKeys = useCallback(async () => {
        setKeysLoading(true);
        setKeysError('');
        try {
            const data = await fetchAllApiKeys();
            setAllKeys(data);
        } catch {
            setKeysError('Failed to load API keys');
        } finally {
            setKeysLoading(false);
        }
    }, []);

    useEffect(() => {
        loadKeys();
    }, [loadKeys]);

    const handleToggle = async (id: number) => {
        setActionLoading(id);
        const key = allKeys.find((k) => k.id === id);
        try {
            const result = await toggleApiKey(id);
            setAllKeys((prev) =>
                prev.map((k) => (k.id === id ? { ...k, is_active: result.is_active } : k)),
            );
            toast(
                `"${result.name}" ${result.is_active ? 'enabled' : 'disabled'}`,
                result.is_active ? 'success' : 'info',
            );
        } catch {
            toast(`Failed to toggle "${key?.name ?? 'key'}"`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: number) => {
        setActionLoading(id);
        const key = allKeys.find((k) => k.id === id);
        try {
            await deleteApiKey(id);
            setAllKeys((prev) => prev.filter((k) => k.id !== id));
            toast(`"${key?.name ?? 'API key'}" deleted`, 'success');
        } catch {
            toast(`Failed to delete "${key?.name ?? 'key'}"`, 'error');
        } finally {
            setActionLoading(null);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {(['24h', '7d', '30d'] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                    p === period ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Key
                    </button>
                </div>
            </div>

            {/* All API Keys Table */}
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">All API Keys</h3>
                    <span className="text-xs text-gray-400">{allKeys.length} key{allKeys.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Prefix</th>
                                <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Tier</th>
                                <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Requests</th>
                                <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Errors</th>
                                <th className="text-center px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Last Used</th>
                                <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {keysLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : keysError ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-red-500">{keysError}</td>
                                </tr>
                            ) : allKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                        No API keys yet. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                allKeys.map((key) => {
                                    const stats = usageMap.get(key.id);
                                    return (
                                        <tr key={key.id} className={`hover:bg-gray-50 ${!key.is_active ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3 text-gray-800 font-medium">{key.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{key.key_prefix}...</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[key.tier] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {key.tier}
                                                </span>
                                                <span className="text-gray-400 text-xs ml-1.5">{key.rate_limit_per_minute}/min</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {stats ? stats.request_count.toLocaleString() : (key.usage_count ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={stats && stats.error_count > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                                                    {stats ? stats.error_count : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    key.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${key.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {key.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                                                {key.last_used_at
                                                    ? new Date(key.last_used_at).toLocaleString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleToggle(key.id)}
                                                        disabled={actionLoading === key.id}
                                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title={key.is_active ? 'Disable key' : 'Enable key'}
                                                    >
                                                        {key.is_active ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    {confirmDelete === key.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(key.id)}
                                                                disabled={actionLoading === key.id}
                                                                className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                                                            >
                                                                Yes
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(null)}
                                                                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300"
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDelete(key.id)}
                                                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete key"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Usage analytics chart */}
            {usage.data && usage.data.length > 0 && (
                <TierPieChart data={usage.data} />
            )}

            <CreateApiKeyDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={loadKeys}
            />
        </div>
    );
}
