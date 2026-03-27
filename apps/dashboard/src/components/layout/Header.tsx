import type { Period } from '../../types/analytics';

interface Props {
    title: string;
    period: Period;
    onPeriodChange: (p: Period) => void;
}

const periods: Period[] = ['24h', '7d', '30d'];

export function Header({ title, period, onPeriodChange }: Props) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                {periods.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPeriodChange(p)}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                            p === period
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
