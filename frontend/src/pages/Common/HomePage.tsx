import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import type { Event } from '../../types/entities';
import EventList from '../../components/Events/EventList';
import EventCarousel from '../../components/Events/EventCarousel';
import SearchInput from '../../components/Common/SearchInput';

const HomePage: React.FC = () => {
    const [events, setEvents] = useState<Event[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
    }, []);

    // Фильтрация событий по поисковому запросу
    const filteredEvents = useMemo(() => {
        if (!events || !searchQuery.trim()) {
            return events;
        }

        const query = searchQuery.toLowerCase().trim();
        return events.filter(event => {
            // Поиск по названию
            const titleMatch = event.title.toLowerCase().includes(query);
            
            // Поиск по тегам (если они есть)
            const tagsMatch = event.tags?.some(tag => {
                // Если тег - объект с полем name
                if (typeof tag === 'object' && tag.name) {
                    return tag.name.toLowerCase().includes(query);
                }
                // Если тег - строка
                if (typeof tag.name === 'string') {
                    return tag.name.toLowerCase().includes(query);
                }
                return false;
            }) || false;

            return titleMatch || tagsMatch;
        });
    }, [events, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-4">Мероприятия</h1>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Поиск по названию или тегам..."
                    />
                </div>

                {/* Карусель ближайших событий */}
                {!isLoading && !error && (
                    <EventCarousel events={filteredEvents} />
                )}
                
                <EventList 
                    events={filteredEvents} 
                    isLoading={isLoading} 
                    error={error}
                    title={searchQuery ? `Результаты поиска (${filteredEvents?.length || 0})` : "Все мероприятия"}
                />
            </div>
        </div>
    );
};

export default HomePage;