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

const EventList: React.FC<EventListProps> = ({ 
    events, 
    isLoading, 
    error, 
    title = "Предстоящие мероприятия" 
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <LoadingSpinner message="Загрузка мероприятий..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-10">
                <ErrorMessage title="Не удалось загрузить мероприятия" message={error} />
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                    <svg 
                        className="mx-auto h-16 w-16 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1} 
                            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" 
                        />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">{title}</h3>
                    <p className="">
                        {title.includes('Результаты поиска') 
                            ? 'По вашему запросу ничего не найдено. Попробуйте изменить критерии поиска.'
                            : 'Пока нет доступных мероприятий.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="text-sm">
                    Найдено: {events.length} {events.length === 1 ? 'мероприятие' : 'мероприятий'}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
};

export default EventList;