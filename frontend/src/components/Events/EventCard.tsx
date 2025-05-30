import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Event } from '../../types/entities';

interface EventCardProps {
    event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const formattedDate = format(new Date(event.dt_start), 'd MMMM yyyy, HH:mm', { locale: ru });
    const spotsAvailable = event.max_participants !== null
        ? event.spots_left !== null ? `${event.spots_left} мест свободно` : 'Мест нет'
        : 'Участие свободное';

    return (
        <Link to={`/events/${event.id}`} className="block group">
            <div className="bg-gray-900 text-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative">
                {/* Background image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                    {/* {event.image_url ? (
                        <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg 
                                className="w-16 h-16 text-gray-600" 
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
                        </div>
                    )} */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-gray-200 mb-3 line-clamp-2">
                        {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                        <p className="text-gray-300 text-sm flex items-center">
                            <svg 
                                className="w-4 h-4 mr-2 flex-shrink-0" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2-2V9a2 2 0 01-2-2z" 
                                />
                            </svg>
                            Дата: {formattedDate}
                        </p>
                        
                        <p className="text-gray-300 text-sm flex items-center">
                            <svg 
                                className="w-4 h-4 mr-2 flex-shrink-0" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                                />
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                                />
                            </svg>
                            Место: {event.location_text}
                        </p>
                        
                        {event.organizer && (
                            <p className="text-gray-300 text-sm flex items-center">
                                <svg 
                                    className="w-4 h-4 mr-2 flex-shrink-0" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                                    />
                                </svg>
                                Организатор: {event.organizer.username || event.organizer.name || 'Неизвестный'}
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {event.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                    key={typeof tag === 'object' ? tag.id : index}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                                    style={typeof tag === 'object' && tag.color ? { backgroundColor: tag.color } : {}}
                                >
                                    {typeof tag === 'object' ? tag.name : tag}
                                </span>
                            ))}
                            {event.tags.length > 3 && (
                                <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                                    +{event.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Participation info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="flex items-center text-sm text-gray-400">
                            {event.max_participants && (
                                <>
                                    <svg 
                                        className="w-4 h-4 mr-1" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                                        />
                                    </svg>
                                    Участников: {event.max_participants - (event.spots_left || 0)}/{event.max_participants}
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center">
                            <svg 
                                className="w-4 h-4 mr-1 text-green-400" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path 
                                    fillRule="evenodd" 
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                                    clipRule="evenodd" 
                                />
                            </svg>
                            <span className="text-sm text-green-400 font-medium">
                                {spotsAvailable}
                            </span>
                        </div>
                    </div>

                    {/* Registration button */}
                    <div className="mt-4">
                        <div className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg text-center font-semibold transition-colors duration-200 group-hover:bg-indigo-500">
                            ЗАПИСАТЬСЯ
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;