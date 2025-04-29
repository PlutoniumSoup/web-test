// src/App.tsx

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Store and Initialization
import { useAuthStore, initializeAuth } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Page Components
// Common
import HomePage from './pages/Common/HomePage';
import EventDetailPage from './pages/Common/EventDetailPage';
import NotFoundPage from './pages/Common/NotFoundPage';
// Auth
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
// Student
import MyEventsPage from './pages/Student/MyEventsPage';
// Organizer
import OrganizerDashboardPage from './pages/Organizer/OrganizerDashboardPage';
import CreateEventPage from './pages/Organizer/CreateEventPage';
import EditEventPage from './pages/Organizer/EditEventPage'; // Импортируем страницу редактирования
import EventParticipantsPage from './pages/Organizer/EventParticipantsPage';
import CheckInPage from './pages/Organizer/CheckInPage';

// Helper Components
import ProtectedRoute from './components/Auth/ProtectedRoute'; // Компонент для защиты роутов
import LoadingSpinner from './components/Common/LoadingSpinner'; // Спиннер загрузки

function App() {
    // Получаем статус загрузки из Zustand store
    const isLoadingAuth = useAuthStore((state) => state.isLoading);

    // Выполняем инициализацию аутентификации один раз при монтировании App
    useEffect(() => {
        initializeAuth();
    }, []); // Пустой массив зависимостей гарантирует вызов только один раз

    // Если идет проверка токена или загрузка данных пользователя, показываем спиннер
    if (isLoadingAuth) {
        return <LoadingSpinner fullscreen message="Загрузка приложения..." />;
    }

    // После завершения инициализации рендерим роуты
    return (
        <Routes>
            {/* Оборачиваем основные страницы в MainLayout (с Navbar и отступами) */}
            <Route path="/" element={<MainLayout />}>

                {/* --- Публичные роуты и для всех аутентифицированных --- */}
                <Route index element={<HomePage />} /> {/* Главная страница */}
                <Route path="events/:eventId" element={<EventDetailPage />} /> {/* Детали мероприятия */}

                {/* Страницы входа и регистрации (тоже внутри MainLayout для простоты MVP) */}
                {/* Можно вынести их из MainLayout, если нужен другой вид */}
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* --- Защищенные роуты для СТУДЕНТОВ --- */}
                <Route element={<ProtectedRoute roles={['student']} />}>
                    {/* Все дочерние роуты здесь требуют роли 'student' */}
                    <Route path="my-events" element={<MyEventsPage />} />
                    {/* Можно добавить другие страницы студента сюда */}
                </Route>

                {/* --- Защищенные роуты для ОРГАНИЗАТОРОВ --- */}
                <Route element={<ProtectedRoute roles={['organizer']} />}>
                    {/* Все дочерние роуты здесь требуют роли 'organizer' */}
                    <Route path="dashboard" element={<OrganizerDashboardPage />} /> {/* Панель организатора */}
                    <Route path="create-event" element={<CreateEventPage />} /> {/* Создание мероприятия */}
                    <Route path="edit-event/:eventId" element={<EditEventPage />} /> {/* Редактирование мероприятия */}
                    <Route path="events/:eventId/participants" element={<EventParticipantsPage />} /> {/* Список участников */}
                    <Route path="events/:eventId/check-in" element={<CheckInPage />} /> {/* Страница Check-in */}
                    {/* Можно добавить другие страницы организатора сюда */}
                </Route>

                {/* --- Страница не найдена (404) --- */}
                {/* Размещаем в конце, чтобы сработала, если ни один путь выше не подошел */}
                <Route path="*" element={<NotFoundPage />} />

            </Route> {/* Конец MainLayout */}

            {/* Сюда можно добавить роуты, которые НЕ должны использовать MainLayout */}
            {/* Например: <Route path="/special-page" element={<SpecialPage />} /> */}

        </Routes>
    );
}

export default App;