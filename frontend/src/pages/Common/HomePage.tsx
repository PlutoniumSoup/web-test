import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import type { Event } from '../../types/entities';
import EventList from '../../components/Events/EventList';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const HomePage: React.FC = () => {
    const [events, setEvents] = useState<Event[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get<Event[]>('/events/');
                setEvents(response.data);
            } catch (err: any) {
                console.error("Error fetching events:", err);
                setError(err.response?.data?.detail || err.message || "Не удалось загрузить мероприятия.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []); // Загружаем один раз при монтировании

    return (
        <div>
            {/* Можно добавить заголовок или баннер */}
            <EventList events={events} isLoading={isLoading} error={error} />
        </div>
    );
};

export default HomePage;