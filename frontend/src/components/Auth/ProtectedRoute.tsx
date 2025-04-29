// src/components/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
    roles?: ('student' | 'organizer')[]; // Какие роли разрешены
    // allowUnauthenticated?: boolean; // Разрешить неаутентифицированных?
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Если не аутентифицирован, редирект на логин
        // Сохраняем путь, куда пользователь хотел попасть
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Если роли указаны и у пользователя нет нужной роли
    if (roles && user) {
        const hasRole = roles.some(role =>
            (role === 'student' && user.is_student) ||
            (role === 'organizer' && user.is_organizer)
        );
        if (!hasRole) {
            // Если роль не подходит, можно редиректить на главную или показывать страницу "Доступ запрещен"
            return <Navigate to="/" replace />; // Или на кастомную страницу ошибки доступа
        }
    }

    // Если все проверки пройдены, рендерим дочерний роут
    return <Outlet />;
};

export default ProtectedRoute;