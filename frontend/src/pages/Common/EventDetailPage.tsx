import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import type { Event as EventType } from '../../types/entities'; // Переименовали, чтобы не конфликтовать с DOM Event
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Button from '../../components/Common/Button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const EventDetailPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [event, setEvent] = useState<EventType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false); // Для кнопок регистрации/отмены

    const fetchEventDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<EventType>(`/events/${eventId}/`);
            setEvent(response.data);
        } catch (err: any) {
            console.error("Error fetching event details:", err);
            if (err.response?.status === 404) {
                 setError("Мероприятие не найдено.");
            } else {
                setError(err.response?.data?.detail || err.message || "Не удалось загрузить детали мероприятия.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
        } else {
            setError("Некорректный ID мероприятия.");
            setIsLoading(false);
        }
    }, [eventId, fetchEventDetails]);

    const handleRegister = async () => {
        if (!eventId) return;
        setIsActionLoading(true);
        setError(null); // Сброс предыдущих ошибок действия
        try {
            await axiosInstance.post(`/events/${eventId}/register/`);
            // Обновить состояние события (is_registered = true) или перезапросить
            await fetchEventDetails(); // Простой способ обновить
        } catch (err: any) {
             console.error("Registration error:", err.response?.data);
             setError(err.response?.data?.detail || "Ошибка при регистрации."); // Используем detail если есть
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnregister = async () => {
         if (!eventId) return;
        setIsActionLoading(true);
        setError(null);
        try {
            await axiosInstance.delete(`/events/${eventId}/unregister/`);
            // Обновить состояние события (is_registered = false) или перезапросить
            await fetchEventDetails();
        } catch (err: any) {
             console.error("Unregistration error:", err.response?.data);
            setError(err.response?.data?.detail || "Ошибка при отмене регистрации.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner fullscreen message="Загрузка мероприятия..." />;
    }

    if (error && !event) { // Показываем ошибку только если нет данных о событии
         return <ErrorMessage title="Ошибка загрузки" message={error} />;
    }

    if (!event) {
         return <ErrorMessage title="Ошибка" message="Мероприятие не найдено." />; // На случай если fetch не вернул ошибку, но event === null
    }

    const formattedDate = format(new Date(event.dt_start), 'd MMMM yyyy \'в\' HH:mm', { locale: ru });
    const spotsAvailable = event.max_participants !== null
        ? event.spots_left !== null ? `${event.spots_left} из ${event.max_participants} мест свободно` : 'Мест нет'
        : 'Количество участников не ограничено';
    const canRegister = !isActionLoading && event.spots_left !== 0 && new Date(event.dt_start) > new Date(); // Нельзя регистрироваться на прошедшее или если нет мест

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{event.title}</h1>

            {/* Сообщение об ошибке действия */}
             {error && <ErrorMessage title="Ошибка действия" message={error} />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{event.description || "Описание отсутствует."}</p>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                    <p><strong>Дата:</strong> {formattedDate}</p>
                    <p><strong>Место:</strong> {event.location_text}</p>
                    <p><strong>Организатор:</strong> {event.organizer.name || event.organizer.username}</p>
                     <p><strong>Места:</strong> {spotsAvailable}</p>
                     <p className="text-xs text-gray-400">Опубликовано: {format(new Date(event.created_at), 'dd.MM.yyyy', { locale: ru })}</p>
                </div>
            </div>


            {/* Кнопки действий для студента */}
            {isAuthenticated && user?.is_student && (
                <div className="mt-6 pt-4 border-t">
                    {event.is_registered ? (
                        <Button
                            variant="danger"
                            onClick={handleUnregister}
                            isLoading={isActionLoading}
                            disabled={isActionLoading || new Date(event.dt_start) < new Date()} // Нельзя отменить на прошедшее
                        >
                            Отменить регистрацию
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleRegister}
                            isLoading={isActionLoading}
                             disabled={!canRegister} // Используем вычисленное значение
                        >
                            Зарегистрироваться
                        </Button>
                    )}
                    {!canRegister && !event.is_registered && (
                         <p className="text-sm text-yellow-700 mt-2">
                            {new Date(event.dt_start) < new Date() ? "Мероприятие уже прошло." : "Регистрация невозможна (нет мест или событие завершилось)."}
                         </p>
                    )}
                </div>
            )}

             {/* Ссылки для организатора */}
            {isAuthenticated && user?.is_organizer && event.is_organizer && (
                <div className="mt-6 pt-4 border-t space-x-2">
                    <Link to={`/edit-event/${event.id}`}>
                        <Button variant="secondary" size="sm">Редактировать</Button>
                    </Link>
                    <Link to={`/events/${event.id}/participants`}>
                        <Button variant="secondary" size="sm">Участники</Button>
                    </Link>
                     <Link to={`/events/${event.id}/check-in`}>
                        <Button variant="primary" size="sm">Начать Check-in</Button>
                    </Link>
                    {/* Добавить кнопку удаления (с подтверждением) */}
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;