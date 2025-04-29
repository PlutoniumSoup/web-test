import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
// Добавьте Textarea компонент, если нужно

const CreateEventPage: React.FC = () => {
    const navigate = useNavigate();
    // Для страницы редактирования понадобится useParams и useEffect для загрузки данных
    // const { eventId } = useParams<{ eventId: string }>();
    // const isEditing = !!eventId;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dt_start: '', // Формат YYYY-MM-DDTHH:mm
        location_text: '',
        max_participants: '', // Пусто или число
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

     // useEffect для загрузки данных при редактировании (добавить на EditEventPage)
    // useEffect(() => {
    //     if (isEditing && eventId) {
    //         // Загрузить данные события и установить в formData
    //         // setIsLoading(true); ... fetch ... setFormData ... setIsLoading(false);
    //         // Не забудьте правильно форматировать дату для datetime-local
    //     }
    // }, [eventId, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        const payload = {
            ...formData,
            // Преобразуем max_participants в null если пусто, или в число
             max_participants: formData.max_participants === '' ? null : parseInt(formData.max_participants, 10) || null,
            // Убедимся что дата в правильном формате (если нужно)
            // dt_start: formData.dt_start ? new Date(formData.dt_start).toISOString() : null,
        };

        try {
            // const request = isEditing
            //     ? axiosInstance.put(`/events/${eventId}/`, payload)
            //     : axiosInstance.post('/events/', payload);
            const response = await axiosInstance.post('/events/', payload);

            // Успешно создано/обновлено
            navigate(`/events/${response.data.id}`); // Переход на страницу события

        } catch (err: any) {
             console.error("Event creation/update error:", err.response?.data);
             if (err.response?.data && typeof err.response.data === 'object') {
                 const backendErrors: Record<string, string[]> = err.response.data;
                 const newFieldErrors: Record<string, string> = {};
                 let generalError = '';
                 for (const field in backendErrors) {
                     newFieldErrors[field] = backendErrors[field].join(' ');
                 }
                 generalError = newFieldErrors.non_field_errors || newFieldErrors.detail || "Ошибка сохранения. Проверьте данные.";
                 setError(generalError);
                 delete newFieldErrors.non_field_errors;
                 delete newFieldErrors.detail;
                 setFieldErrors(newFieldErrors);
             } else {
                 setError("Произошла неизвестная ошибка.");
             }
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="max-w-2xl mx-auto bg-white p-6 shadow-lg rounded-lg">
             {/* <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Редактировать мероприятие' : 'Создать новое мероприятие'}</h1> */}
             <h1 className="text-2xl font-bold mb-6">Создать новое мероприятие</h1>
             <form onSubmit={handleSubmit} className="space-y-4">
                {error && !Object.keys(fieldErrors).length && <ErrorMessage message={error} />}
                <Input label="Название" name="title" value={formData.title} onChange={handleChange} required error={fieldErrors.title} />
                <div>
                     <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                     <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${fieldErrors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        />
                     {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
                 </div>
                <Input label="Дата и время начала" name="dt_start" type="datetime-local" value={formData.dt_start} onChange={handleChange} required error={fieldErrors.dt_start} />
                <Input label="Место проведения" name="location_text" value={formData.location_text} onChange={handleChange} required error={fieldErrors.location_text} />
                <Input label="Макс. участников (пусто = безлимит)" name="max_participants" type="number" min="0" value={formData.max_participants} onChange={handleChange} error={fieldErrors.max_participants} />
                <div className="pt-4">
                    <Button type="submit" isLoading={isLoading} >
                         {/* {isEditing ? 'Сохранить изменения' : 'Создать мероприятие'} */}
                         Создать мероприятие
                    </Button>
                     <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')} className="ml-2">
                        Отмена
                    </Button>
                </div>
             </form>
         </div>
    );
};

export default CreateEventPage; // или EditEventPage