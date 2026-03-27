import { useState, FormEvent } from 'react';
import { createApiKey } from '../../api/analytics';
import { useToast } from '../ui/Toast';

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function CreateApiKeyDialog({ open, onClose, onCreated }: Props) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const result = await createApiKey(name.trim(), tier);
            setCreatedKey(result.raw_key);
            onCreated();
            toast(`API key "${name.trim()}" created`, 'success');
        } catch (err: any) {
            setError(err.response?.data?.error ?? 'Failed to create API key');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (createdKey) {
            await navigator.clipboard.writeText(createdKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setName('');
        setTier('free');
        setError('');
        setCreatedKey(null);
        setCopied(false);
        onClose();
    };

    const tierInfo = {
        free: { limit: '60 req/min', color: 'border-gray-300 bg-gray-50' },
        pro: { limit: '300 req/min', color: 'border-indigo-300 bg-indigo-50' },
        enterprise: { limit: '1000 req/min', color: 'border-purple-300 bg-purple-50' },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10">
                {createdKey ? (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">API Key Created</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            Copy this key now. It will not be shown again.
                        </p>
                        <div className="relative">
                            <code className="block w-full p-3 pr-16 bg-gray-900 text-green-400 rounded-lg text-sm font-mono break-all">
                                {createdKey}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                            <p className="text-xs text-amber-700">
                                <strong>Warning:</strong> Store this key securely. It cannot be recovered once you close this dialog.
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Done
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900">Create API Key</h2>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Key Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Integration"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tier
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['free', 'pro', 'enterprise'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTier(t)}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                                                tier === t
                                                    ? tierInfo[t].color + ' ring-2 ring-indigo-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="text-sm font-medium capitalize">{t}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{tierInfo[t].limit}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Key'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
