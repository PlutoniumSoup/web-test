// src/pages/Organizer/EditEventPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import type { Event as EventType } from '../../types/entities'; // Переименовали

// Добавьте компонент Textarea, если он есть, или используйте стандартный
// import Textarea from '../../components/Common/Textarea';

const EditEventPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>(); // Получаем ID из URL

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dt_start: '', // Формат YYYY-MM-DDTHH:mm для input[type=datetime-local]
        location_text: '',
        max_participants: '', // Пусто или число как строка
    });
    const [isLoadingData, setIsLoadingData] = useState(true); // Загрузка данных события
    const [isSubmitting, setIsSubmitting] = useState(false); // Отправка формы
    const [loadError, setLoadError] = useState<string | null>(null); // Ошибка загрузки данных
    const [formError, setFormError] = useState<string | null>(null); // Общая ошибка формы
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Ошибки полей формы

    // Функция для загрузки данных события
    const fetchEventData = useCallback(async () => {
        if (!eventId) {
            setLoadError("ID мероприятия не найден в URL.");
            setIsLoadingData(false);
            return;
        }
        setIsLoadingData(true);
        setLoadError(null);
        try {
            const response = await axiosInstance.get<EventType>(`/events/${eventId}/`);
            const event = response.data;

            // Форматируем данные для формы
            setFormData({
                title: event.title,
                description: event.description,
                // Преобразуем ISO строку в формат для datetime-local (YYYY-MM-DDTHH:mm)
                // ВНИМАНИЕ: Это простейшее преобразование, может не учитывать часовые пояса корректно.
                // Убедитесь, что API возвращает дату/время в ожидаемом формате или используйте date-fns для надежного парсинга/форматирования.
                dt_start: event.dt_start ? event.dt_start.slice(0, 16) : '',
                location_text: event.location_text,
                max_participants: event.max_participants === null ? '' : String(event.max_participants),
            });
        } catch (err: any) {
            console.error("Error fetching event data:", err);
             if (err.response?.status === 404) {
                setLoadError("Мероприятие для редактирования не найдено.");
             } else if (err.response?.status === 403) {
                 setLoadError("У вас нет прав на редактирование этого мероприятия.");
             } else {
                setLoadError(err.response?.data?.detail || "Не удалось загрузить данные мероприятия.");
            }
        } finally {
            setIsLoadingData(false);
        }
    }, [eventId]);

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        fetchEventData();
    }, [fetchEventData]); // fetchEventData зависит от eventId, поэтому его достаточно

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         // Сбрасываем ошибки при изменении
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (formError) setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!eventId) return; // На всякий случай

        setIsSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        const payload = {
            ...formData,
            // Преобразуем max_participants в null если пусто, или в число
             max_participants: formData.max_participants === '' ? null : parseInt(formData.max_participants, 10) || null,
            // Можно добавить валидацию или преобразование dt_start обратно в ISO, если API требует
            // dt_start: formData.dt_start ? new Date(formData.dt_start).toISOString() : null, // Пример
        };

        try {
            // Используем PUT для полного обновления (или PATCH для частичного)
            const response = await axiosInstance.put(`/events/${eventId}/`, payload);

            // Успешно обновлено
            navigate(`/events/${response.data.id}`); // Переход на страницу события

        } catch (err: any) {
             console.error("Event update error:", err.response?.data);
             if (err.response?.data && typeof err.response.data === 'object') {
                 const backendErrors: Record<string, string[]> = err.response.data;
                 const newFieldErrors: Record<string, string> = {};
                 let generalError = '';
                 for (const field in backendErrors) {
                     newFieldErrors[field] = backendErrors[field].join(' ');
                 }
                 generalError = newFieldErrors.non_field_errors || newFieldErrors.detail || "Ошибка сохранения. Проверьте данные.";
                 setFormError(generalError);
                 delete newFieldErrors.non_field_errors;
                 delete newFieldErrors.detail;
                 setFieldErrors(newFieldErrors);
             } else {
                 setFormError("Произошла неизвестная ошибка при сохранении.");
             }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Показываем лоадер или ошибку во время загрузки данных
    if (isLoadingData) {
        return <LoadingSpinner fullscreen message="Загрузка данных мероприятия..." />;
    }
    if (loadError) {
         return (
            <div className="max-w-2xl mx-auto">
                 <ErrorMessage title="Ошибка загрузки" message={loadError} />
                 <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
                     ← Вернуться к панели управления
                 </Link>
            </div>
         );
    }

    // Основная форма
    return (
         <div className="max-w-2xl mx-auto bg-white p-6 shadow-lg rounded-lg">
             <h1 className="text-2xl font-bold mb-6">Редактировать мероприятие</h1>
             <form onSubmit={handleSubmit} className="space-y-4">
                {formError && !Object.keys(fieldErrors).length && <ErrorMessage message={formError} />}
                <Input label="Название" name="title" value={formData.title} onChange={handleChange} required error={fieldErrors.title} disabled={isSubmitting}/>
                <div>
                     <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                     <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${fieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        />
                     {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
                 </div>
                <Input label="Дата и время начала" name="dt_start" type="datetime-local" value={formData.dt_start} onChange={handleChange} required error={fieldErrors.dt_start} disabled={isSubmitting}/>
                <Input label="Место проведения" name="location_text" value={formData.location_text} onChange={handleChange} required error={fieldErrors.location_text} disabled={isSubmitting}/>
                <Input label="Макс. участников (пусто = безлимит)" name="max_participants" type="number" min="0" value={formData.max_participants} onChange={handleChange} error={fieldErrors.max_participants} disabled={isSubmitting}/>
                <div className="pt-4 flex items-center space-x-3">
                    <Button type="submit" isLoading={isSubmitting} disabled={isLoadingData}>
                         Сохранить изменения
                    </Button>
                     <Button type="button" variant="ghost" onClick={() => navigate(eventId ? `/events/${eventId}` : '/dashboard')} disabled={isSubmitting}>
                        Отмена
                    </Button>
                </div>
             </form>
         </div>
    );
};

export default EditEventPage;