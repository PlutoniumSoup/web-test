import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        is_organizer: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Для ошибок полей

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
         // Сбрасываем ошибку поля при изменении
        if (fieldErrors[name]) {
             setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
         // Сбрасываем общую ошибку
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ confirmPassword: 'Пароли не совпадают.' });
            return;
        }
        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            await axiosInstance.post('/auth/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
                is_organizer: formData.is_organizer,
            });
            // Успешная регистрация
            navigate('/login', { state: { message: 'Регистрация прошла успешно! Теперь вы можете войти.' } });

        } catch (err: any) {
            console.error("Registration error:", err.response?.data);
            if (err.response?.data && typeof err.response.data === 'object') {
                // Обрабатываем ошибки полей от DRF
                const backendErrors: Record<string, string[]> = err.response.data;
                const newFieldErrors: Record<string, string> = {};
                let generalError = '';
                for (const field in backendErrors) {
                    newFieldErrors[field] = backendErrors[field].join(' '); // Берем первое сообщение
                }
                 // Если есть ошибка non_field_errors или detail, показываем как общую
                generalError = newFieldErrors.non_field_errors || newFieldErrors.detail || "Ошибка регистрации. Проверьте введенные данные.";
                setError(generalError);
                // Удаляем общие ошибки из fieldErrors
                 delete newFieldErrors.non_field_errors;
                 delete newFieldErrors.detail;
                 setFieldErrors(newFieldErrors);

            } else {
                setError(err.response?.data?.detail || "Произошла неизвестная ошибка.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 shadow-lg rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Регистрация в СтудАфишке
                    </h2>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                     {error && !Object.keys(fieldErrors).length && <ErrorMessage message={error} />}
                    <Input
                        label="Имя пользователя (логин)"
                        id="username"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        error={fieldErrors.username}
                    />
                    <Input
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        error={fieldErrors.email}
                    />
                     <Input
                        label="Ваше имя (для отображения)"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={fieldErrors.name}
                    />
                    <Input
                        label="Пароль"
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        error={fieldErrors.password}
                    />
                     <Input
                        label="Подтвердите пароль"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={fieldErrors.confirmPassword}
                    />

                    <div className="flex items-center">
                         <input
                            id="is_organizer"
                            name="is_organizer"
                            type="checkbox"
                            checked={formData.is_organizer}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_organizer" className="ml-2 block text-sm text-gray-900">
                            Я хочу быть организатором мероприятий
                        </label>
                    </div>

                    <div>
                        <Button type="submit" isLoading={isLoading} className="w-full">
                            Зарегистрироваться
                        </Button>
                    </div>
                </form>
                <div className="text-sm text-center">
                     <p className="text-gray-600">
                         Уже есть аккаунт?{' '}
                         <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                             Войти
                         </Link>
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default RegisterPage;