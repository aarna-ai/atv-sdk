import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (password: string) => {
        await login(password);
        navigate('/dashboard');
    };

    return <LoginForm onLogin={handleLogin} />;
}
