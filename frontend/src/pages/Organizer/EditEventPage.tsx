// src/pages/Organizer/EditEventPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import type { Event as EventType, Tag } from '../../types/entities';

const EditEventPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dt_start: '',
        location_text: '',
        max_participants: '',
    });
    
    // Состояние для тегов
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tagColor, setTagColor] = useState('#007bff');
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Загрузка списка тегов
    const fetchTags = useCallback(async () => {
        try {
            const response = await axiosInstance.get<Tag[]>('/tags/');
            setAvailableTags(response.data);
        } catch (err) {
            console.error('Ошибка загрузки тегов:', err);
        }
    }, []);

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

            setFormData({
                title: event.title,
                description: event.description,
                dt_start: event.dt_start ? event.dt_start.slice(0, 16) : '',
                location_text: event.location_text,
                max_participants: event.max_participants === null ? '' : String(event.max_participants),
            });

            // Устанавливаем выбранные теги
            if (event.tags) {
                setSelectedTags(event.tags.map(tag => tag.id));
            }
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
        Promise.all([fetchEventData(), fetchTags()]);
    }, [fetchEventData, fetchTags]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (formError) setFormError(null);
    };

    // Обработка выбора тегов
    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev => 
            prev.includes(tagId) 
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    // Создание нового тега
    const handleCreateTag = async () => {
        if (!tagInput.trim()) return;
        
        setIsCreatingTag(true);
        try {
            const response = await axiosInstance.post<Tag>('/tags/', {
                name: tagInput.trim(),
                color: tagColor
            });
            
            const newTag = response.data;
            setAvailableTags(prev => [...prev, newTag]);
            setSelectedTags(prev => [...prev, newTag.id]);
            setTagInput('');
            setTagColor('#007bff');
        } catch (err: any) {
            console.error('Ошибка создания тега:', err);
            if (err.response?.data?.name) {
                alert(err.response.data.name[0]);
            } else {
                alert('Ошибка при создании тега');
            }
        } finally {
            setIsCreatingTag(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!eventId) return;

        setIsSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        const payload = {
            ...formData,
            max_participants: formData.max_participants === '' ? null : parseInt(formData.max_participants, 10) || null,
            tags: selectedTags // Добавляем теги
        };

        try {
            const response = await axiosInstance.put(`/events/${eventId}/`, payload);
            navigate(`/events/${response.data.id}`);
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

    return (
        <div className="max-w-2xl mx-auto bg-gray-900 text-white p-6 shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-white">Редактировать мероприятие</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {formError && !Object.keys(fieldErrors).length && <ErrorMessage message={formError} />}
                
                <Input 
                    label="Название" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    error={fieldErrors.title} 
                    disabled={isSubmitting}
                />
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                        Описание
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm bg-gray-800 text-white ${
                            fieldErrors.description 
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                    />
                    {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>}
                </div>
                
                <Input 
                    label="Дата и время начала" 
                    name="dt_start" 
                    type="datetime-local" 
                    value={formData.dt_start} 
                    onChange={handleChange} 
                    required 
                    error={fieldErrors.dt_start} 
                    disabled={isSubmitting}
                />
                
                <Input 
                    label="Место проведения" 
                    name="location_text" 
                    value={formData.location_text} 
                    onChange={handleChange} 
                    required 
                    error={fieldErrors.location_text} 
                    disabled={isSubmitting}
                />
                
                <Input 
                    label="Макс. участников (пусто = безлимит)" 
                    name="max_participants" 
                    type="number" 
                    min="0" 
                    value={formData.max_participants} 
                    onChange={handleChange} 
                    error={fieldErrors.max_participants} 
                    disabled={isSubmitting}
                />

                {/* Секция тегов */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-400">Теги</label>
                    
                    {/* Список доступных тегов */}
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-600 rounded-md bg-gray-800">
                        {availableTags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleTagToggle(tag.id)}
                                disabled={isSubmitting}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                    selectedTags.includes(tag.id)
                                        ? 'text-white shadow-md'
                                        : 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                                }`}
                                style={{
                                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined
                                }}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>

                    {/* Создание нового тега */}
                    <div className="border-t border-gray-600 pt-3">
                        <p className="text-sm text-gray-400 mb-2">Создать новый тег:</p>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Название тега"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    disabled={isSubmitting || isCreatingTag}
                                    className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
                                />
                            </div>
                            <div>
                                <input
                                    type="color"
                                    value={tagColor}
                                    onChange={(e) => setTagColor(e.target.value)}
                                    disabled={isSubmitting || isCreatingTag}
                                    className="w-10 h-10 border border-gray-600 rounded cursor-pointer disabled:cursor-not-allowed"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleCreateTag}
                                disabled={!tagInput.trim() || isSubmitting || isCreatingTag}
                                isLoading={isCreatingTag}
                                variant="secondary"
                            >
                                Создать
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center space-x-3">
                    <Button type="submit" isLoading={isSubmitting} disabled={isLoadingData}>
                        Сохранить изменения
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => navigate(eventId ? `/events/${eventId}` : '/dashboard')} 
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditEventPage;