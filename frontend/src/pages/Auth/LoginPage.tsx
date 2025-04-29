import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuthStore, initializeAuth } from '../../store/authStore';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
import type { User } from '../../types/entities';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setTokens, setUser } = useAuthStore(); // Не используем initializeAuth здесь

    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const from = location.state?.from?.pathname || '/'; // Куда редиректить после логина

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Получаем токены
            const tokenResponse = await axiosInstance.post<{ access: string; refresh: string }>('/auth/token/', {
                // Бэкенд DRF Simple JWT по умолчанию принимает 'username' и 'password'
                // Если бэкенд настроен на прием email, можно использовать usernameOrEmail
                username: usernameOrEmail, // Используем 'username' для логина
                password: password,
            });

            const { access, refresh } = tokenResponse.data;
            setTokens(access, refresh); // Сохраняем токены в store

            // 2. Запрашиваем данные пользователя (используем новый токен)
            // Важно: axiosInstance уже настроен использовать токен из store в interceptor
            const userResponse = await axiosInstance.get<User>('/users/me/');
            setUser(userResponse.data); // Сохраняем пользователя в store

            // 3. Перенаправляем пользователя
            navigate(from, { replace: true });

        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.detail || "Неверный логин или пароль.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 shadow-lg rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Вход в СтудАфишку
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                     {error && <ErrorMessage message={error} />}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <Input
                                label="Имя пользователя или Email"
                                id="username"
                                name="username"
                                type="text" // Позволяем вводить и username и email
                                autoComplete="username"
                                required
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                placeholder="Имя пользователя или Email"
                            />
                        </div>
                        <div className="pt-4"> {/* Добавим отступ */}
                            <Input
                                label="Пароль"
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Пароль"
                            />
                        </div>
                    </div>

                    {/* Добавить "Забыли пароль?" если нужно */}

                    <div>
                        <Button type="submit" isLoading={isLoading} className="w-full">
                            Войти
                        </Button>
                    </div>
                </form>
                 <div className="text-sm text-center">
                     <p className="text-gray-600">
                         Нет аккаунта?{' '}
                         <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                             Зарегистрироваться
                         </Link>
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default LoginPage;