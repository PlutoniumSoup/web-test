import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from './Button'; // Ваш компонент кнопки

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Редирект на главную после логаута
    };

    // Стили для активной ссылки NavLink
    const activeClassName = "bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium";
    const inactiveClassName = "text-indigo-100 hover:bg-indigo-500 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium";

    return (
        <nav className="bg-indigo-600">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 text-white font-bold text-xl">
                           СтудАфишка
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <NavLink
                                    to="/"
                                    className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
                                >
                                    Мероприятия
                                </NavLink>

                                {isAuthenticated && user?.is_student && (
                                    <NavLink
                                        to="/my-events"
                                        className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
                                    >
                                        Мои События
                                    </NavLink>
                                )}
                                {isAuthenticated && user?.is_organizer && (
                                    <NavLink
                                        to="/dashboard"
                                        className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
                                    >
                                        Панель Организатора
                                    </NavLink>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {isAuthenticated ? (
                                <>
                                    <span className="text-indigo-100 mr-3 text-sm">
                                        Привет, {user?.name || user?.username}!
                                    </span>
                                    <Button onClick={handleLogout} variant="secondary" size="sm">
                                        Выйти
                                    </Button>
                                </>
                            ) : (
                                <div className="space-x-2">
                                    <Button onClick={() => navigate('/login')} variant="secondary" size="sm">
                                        Войти
                                    </Button>
                                    <Button onClick={() => navigate('/register')} variant='ghost' size="sm" className="text-white border-indigo-400 hover:bg-indigo-500 hover:bg-opacity-75">
                                        Регистрация
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Добавить мобильное меню, если нужно */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;