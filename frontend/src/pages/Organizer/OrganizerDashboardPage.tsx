import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import type { Event } from '../../types/entities';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Button from '../../components/Common/Button';
// Можно создать OrganizerEventCard или использовать EventCard с доп. кнопками

const OrganizerDashboardPage: React.FC = () => {
    const [myEvents, setMyEvents] = useState<Event[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMyEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Бэкенд должен отфильтровать события для текущего организатора
                const response = await axiosInstance.get<Event[]>('/events/');
                // Фильтруем на клиенте, если бэкенд не отфильтровал (лучше фильтровать на бэке!)
                // const userId = useAuthStore.getState().user?.id;
                // setMyEvents(response.data.filter(event => event.organizer.id === userId));
                setMyEvents(response.data); // Предполагаем, что бэк уже отфильтровал
            } catch (err: any) {
                console.error("Error fetching organizer events:", err);
                setError(err.response?.data?.detail || "Не удалось загрузить ваши мероприятия.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyEvents();
    }, []);

    const renderEvents = () => {
         if (isLoading) return <LoadingSpinner message="Загрузка ваших мероприятий..." />;
         if (error) return <ErrorMessage message={error} />;
         if (!myEvents || myEvents.length === 0) return <p className="text-gray-500">Вы еще не создали ни одного мероприятия.</p>;

         return (
             <div className="space-y-4">
                 {myEvents.map(event => (
                     <div key={event.id} className="bg-gray-900 text-white p-4 shadow rounded-lg flex justify-between items-center">
                         <div>
                             <h3 className="font-semibold text-lg text-indigo-500">{event.title}</h3>
                             <p className="text-sm text-gray-500">{new Date(event.dt_start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                         <div className="space-x-2 flex-shrink-0">
                              <Link to={`/events/${event.id}`}>
                                <Button variant="ghost" size="sm">Просмотр</Button>
                            </Link>
                             <Link to={`/edit-event/${event.id}`}>
                                <Button variant="secondary" size="sm">Редакт.</Button>
                            </Link>
                             <Link to={`/events/${event.id}/participants`}>
                                <Button variant="secondary" size="sm">Участники</Button>
                            </Link>
                            <Link to={`/events/${event.id}/check-in`}>
                                <Button variant="primary" size="sm">Check-in</Button>
                            </Link>
                         </div>
                     </div>
                 ))}
             </div>
         );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Панель Организатора</h1>
                <Link to="/create-event">
                    <Button variant="primary">Создать мероприятие</Button>
                </Link>
            </div>
            {renderEvents()}
        </div>
    );
};

export default OrganizerDashboardPage;