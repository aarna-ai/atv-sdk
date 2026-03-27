import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { EndpointsPage } from './pages/EndpointsPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ErrorsPage } from './pages/ErrorsPage';
import { DefiInsightsPage } from './pages/DefiInsightsPage';
import { useAuth } from './hooks/useAuth';

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/dashboard/login';
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}

export default function App() {
    return (
        <ToastProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/dashboard/login" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <OverviewPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/endpoints"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <EndpointsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/api-keys"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ApiKeysPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/defi"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <DefiInsightsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/errors"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ErrorsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
        </ToastProvider>
    );
}
