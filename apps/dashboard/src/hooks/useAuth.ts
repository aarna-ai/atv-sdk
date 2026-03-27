import { useState, useCallback } from 'react';
import api from '../api/client';

export function useAuth() {
    const [token, setToken] = useState(() => sessionStorage.getItem('admin_token'));

    const login = useCallback(async (password: string): Promise<void> => {
        const { data } = await api.post<{ token: string }>('/admin/login', { password });
        sessionStorage.setItem('admin_token', data.token);
        setToken(data.token);
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('admin_token');
        setToken(null);
    }, []);

    return { isAuthenticated: !!token, login, logout };
}
