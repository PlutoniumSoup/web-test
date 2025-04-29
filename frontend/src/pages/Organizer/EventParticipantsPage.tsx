import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import type { RegistrationFull } from '../../types/entities';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';

const EventParticipantsPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [registrations, setRegistrations] = useState<RegistrationFull[] | null>(null);
    const [eventTitle, setEventTitle] = useState<string>(''); // Для заголовка
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // Загружаем и детали события (для заголовка) и список участников
    const fetchData = useCallback(async () => {
        if (!eventId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Запрос деталей события (можно оптимизировать, если title уже есть)
            const eventPromise = axiosInstance.get(`/events/${eventId}/`);
            // Запрос списка участников
            const participantsPromise = axiosInstance.get<RegistrationFull[]>(`/events/${eventId}/participants/`);

            const [eventResponse, participantsResponse] = await Promise.all([eventPromise, participantsPromise]);

            setEventTitle(eventResponse.data.title);
            setRegistrations(participantsResponse.data);

        } catch (err: any) {
            console.error("Error fetching participants:", err);
            setError(err.response?.data?.detail || "Не удалось загрузить список участников.");
        } finally {
            setIsLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderTable = () => {
        if (isLoading) return <LoadingSpinner message="Загрузка участников..." />;
        if (error) return <ErrorMessage message={error} />;
        if (!registrations || registrations.length === 0) return <p className="text-gray-500">На это мероприятие пока никто не зарегистрировался.</p>;

        return (
            <div className="overflow-x-auto shadow rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус посещения</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {registrations.map((reg) => (
                            <tr key={reg.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reg.student.name || reg.student.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.student.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(reg.registered_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {reg.attended ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Посетил(а)
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Ожидается
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };


    return (
        <div>
            <div className="mb-6">
                <Link to={`/events/${eventId}`} className="text-indigo-600 hover:text-indigo-800 text-sm">← К мероприятию</Link>
                 <h1 className="text-3xl font-bold text-gray-800 mt-2">Участники: {eventTitle}</h1>
            </div>
            {renderTable()}
        </div>
    );
};

export default EventParticipantsPage;