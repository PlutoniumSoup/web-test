import React from 'react';
import type { Event } from '../../types/entities';
import EventCard from './EventCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

interface EventListProps {
    events: Event[] | null;
    isLoading: boolean;
    error: string | null;
    title?: string;
}

const EventList: React.FC<EventListProps> = ({ events, isLoading, error, title = "Предстоящие мероприятия" }) => {
    if (isLoading) {
        return <LoadingSpinner message="Загрузка мероприятий..." />;
    }

    if (error) {
        return <ErrorMessage title="Не удалось загрузить мероприятия" message={error} />;
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <p className="text-gray-500">Пока нет доступных мероприятий.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
};

export default EventList;