import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import type { RegistrationShort } from '../../types/entities';
import MyEventCard from '../../components/Student/MyEventCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const MyEventsPage: React.FC = () => {
    const [registrations, setRegistrations] = useState<RegistrationShort[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unregisteringId, setUnregisteringId] = useState<number | null>(null); // ID события для отмены

    const fetchRegistrations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<RegistrationShort[]>('/my-registrations/');
            setRegistrations(response.data);
        } catch (err: any) {
            console.error("Error fetching registrations:", err);
            setError(err.response?.data?.detail || err.message || "Не удалось загрузить ваши регистрации.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    const handleUnregister = async (eventId: number) => {
        setUnregisteringId(eventId); // Показываем лоадер для конкретной карточки
        setError(null); // Сбрасываем общую ошибку
        try {
            await axiosInstance.delete(`/events/${eventId}/unregister/`);
            // Обновляем список после успешной отмены
            setRegistrations(prev => prev?.filter(reg => {
                 // !!! ВНИМАНИЕ: Нам нужен event.id в RegistrationShort для этого !!!
                 // Если его нет, нужно перезапросить весь список:
                 // fetchRegistrations();
                 // Предположим, что мы как-то получили event.id (например, передали в handleUnregister)
                 // ИЛИ если RegistrationShort содержит event_id
                 // Допустим, есть поле event_id в RegistrationShort (нужно добавить на бэке)
                 return (reg as any).event_id !== eventId; // Пример, если event_id добавлено
            }) || null);
             // ИЛИ просто перезапросить список
             // fetchRegistrations();

        } catch (err: any) {
            console.error("Unregistration error:", err.response?.data);
            setError(err.response?.data?.detail || "Ошибка при отмене регистрации.");
        } finally {
            setUnregisteringId(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner message="Загрузка ваших событий..." />;
        }

        if (error) {
            return <ErrorMessage title="Ошибка" message={error} />;
        }

        if (!registrations || registrations.length === 0) {
            return <p className="text-center text-gray-500 py-10">Вы пока не зарегистрированы ни на одно мероприятие.</p>;
        }

        return (
            <div className="space-y-4">
                {registrations.map((reg) => {
                     // !!! Нужно как-то получить eventId для handleUnregister !!!
                     // Вариант 1: Добавить event.id в MyRegistrationSerializer на бэкенде
                     const eventId = (reg as any).event_id; // Предполагаем, что поле event_id есть
                     if (!eventId) {
                         console.warn("Missing event_id in registration data", reg);
                         // Можно не рендерить кнопку отмены или показать заглушку
                     }

                    return (
                        <MyEventCard
                            key={reg.id}
                            registration={reg}
                            eventId={eventId || 0} // Передаем eventId
                            onUnregister={handleUnregister}
                            isUnregistering={unregisteringId === eventId}
                        />
                    );
                })}
            </div>
        );
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Мои События</h1>
            {renderContent()}
        </div>
    );
};

export default MyEventsPage;