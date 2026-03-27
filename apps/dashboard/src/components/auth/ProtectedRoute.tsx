import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return <Navigate to="/dashboard/login" replace />;
    return <>{children}</>;
}
