import { NavLink } from 'react-router-dom';

const links = [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/dashboard/endpoints', label: 'Endpoints' },
    { to: '/dashboard/api-keys', label: 'API Keys' },
    { to: '/dashboard/defi', label: 'DeFi Insights' },
    { to: '/dashboard/errors', label: 'Errors' },
];

interface Props {
    onLogout: () => void;
}

export function Sidebar({ onLogout }: Props) {
    return (
        <aside className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="p-5 border-b border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">ATV Analytics</h1>
            </div>
            <nav className="flex-1 p-3 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                            `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-3 border-t border-gray-200">
                <button
                    onClick={onLogout}
                    className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}
