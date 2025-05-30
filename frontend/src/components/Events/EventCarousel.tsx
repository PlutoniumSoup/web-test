import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Event } from '../../types/entities';

interface EventCarouselProps {
    events: Event[] | null;
}

const EventCarousel: React.FC<EventCarouselProps> = ({ events }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Получаем 3 ближайших события, отсортированные по дате
    const upcomingEvents = events
        ?.filter(event => new Date(event.dt_start) >= new Date())
        .sort((a, b) => new Date(a.dt_start).getTime() - new Date(b.dt_start).getTime())
        .slice(0, 3) || [];

    // Автопрокрутка каждые 5 секунд
    useEffect(() => {
        if (upcomingEvents.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => 
                prevIndex === upcomingEvents.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, [upcomingEvents.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? upcomingEvents.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        setCurrentIndex(currentIndex === upcomingEvents.length - 1 ? 0 : currentIndex + 1);
    };

    if (!upcomingEvents.length) {
        return null;
    }

    const currentEvent = upcomingEvents[currentIndex];
    const formattedDate = format(new Date(currentEvent.dt_start), 'd MMMM yyyy, HH:mm', { locale: ru });

    return (
        <div className="relative mb-8 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-2xl overflow-hidden">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Main content */}
            <div className="relative z-10 p-8 md:p-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Ближайшие мероприятия
                        </h2>
                        <p className="text-indigo-200">
                            {upcomingEvents.length === 1 
                                ? 'Самое близкое событие' 
                                : `${upcomingEvents.length} ближайших события`}
                        </p>
                    </div>

                    {/* Event card */}
                    <Link 
                        to={`/events/${currentEvent.id}`}
                        className="block group"
                    >
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="grid md:grid-cols-3 gap-6 items-center">
                                {/* Event info */}
                                <div className="md:col-span-2">
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-indigo-200 transition-colors">
                                        {currentEvent.title}
                                    </h3>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-indigo-200">
                                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2-2V9a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="font-medium">{formattedDate}</span>
                                        </div>
                                        
                                        <div className="flex items-center text-indigo-200">
                                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{currentEvent.location_text}</span>
                                        </div>

                                        {currentEvent.organizer && (
                                            <div className="flex items-center text-indigo-200">
                                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>{currentEvent.organizer.username || currentEvent.organizer.name || 'Неизвестный'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {currentEvent.tags && currentEvent.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {currentEvent.tags.slice(0, 4).map((tag, index) => (
                                                <span 
                                                    key={typeof tag === 'object' ? tag.id : index}
                                                    className="px-3 py-1 bg-white/20 text-white text-sm rounded-full backdrop-blur-sm"
                                                >
                                                    {typeof tag === 'object' ? tag.name : tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="text-center md:text-right">
                                    <div className="inline-block bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg group-hover:bg-indigo-100 transition-colors duration-200 shadow-lg">
                                        ЗАПИСАТЬСЯ
                                    </div>
                                    
                                    {currentEvent.max_participants && (
                                        <div className="mt-4 text-indigo-200 text-sm">
                                            <div className="flex items-center justify-center md:justify-end">
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                {currentEvent.spots_left !== null 
                                                    ? `${currentEvent.spots_left} мест свободно`
                                                    : 'Участие свободное'
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Navigation */}
                    {upcomingEvents.length > 1 && (
                        <div className="flex items-center justify-center mt-8 space-x-4">
                            {/* Previous button */}
                            <button
                                onClick={goToPrevious}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                                aria-label="Предыдущее событие"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Dots indicator */}
                            <div className="flex space-x-2">
                                {upcomingEvents.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                            index === currentIndex 
                                                ? 'bg-white scale-125' 
                                                : 'bg-white/50 hover:bg-white/70'
                                        }`}
                                        aria-label={`Перейти к событию ${index + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Next button */}
                            <button
                                onClick={goToNext}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                                aria-label="Следующее событие"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Event counter */}
                    {upcomingEvents.length > 1 && (
                        <div className="text-center mt-4">
                            <span className="text-indigo-200 text-sm">
                                {currentIndex + 1} из {upcomingEvents.length}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventCarousel;