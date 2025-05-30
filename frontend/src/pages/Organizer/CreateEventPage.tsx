// src/pages/Organizer/CreateEventPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import ErrorMessage from '../../components/Common/ErrorMessage';
import type { Tag } from '../../types/entities';
import { useContext } from 'react';
import { useAuthStore } from "../../store/authStore";

const CreateEventPage: React.FC = () => {
    const navigate = useNavigate();

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
    const { isAuthenticated, user, logout } = useAuthStore();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Загрузка списка тегов при монтировании
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axiosInstance.get<Tag[]>('/tags/');
                setAvailableTags(response.data);
            } catch (err) {
                console.error('Ошибка загрузки тегов:', err);
            }
        };
        fetchTags();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (error) setError(null);
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
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
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
        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        const payload = {
            ...formData,
            max_participants: formData.max_participants === '' ? null : parseInt(formData.max_participants, 10) || null,
            tags: selectedTags, // Добавляем теги
            organizer: user
        };

        try {
            const response = await axiosInstance.post('/events/', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            navigate(`/events/${response.data.id}`);
        } catch (err: any) {
            console.error("Event creation error:", err.response?.data);
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
        <div className="max-w-2xl mx-auto bg-gray-900 text-white p-6 shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Создать новое мероприятие</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && !Object.keys(fieldErrors).length && <ErrorMessage message={error} />}
                
                <Input 
                    label="Название" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    error={fieldErrors.title} 
                    disabled={isLoading}
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
                        disabled={isLoading}
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
                    disabled={isLoading}
                />
                
                <Input 
                    label="Место проведения" 
                    name="location_text" 
                    value={formData.location_text} 
                    onChange={handleChange} 
                    required 
                    error={fieldErrors.location_text} 
                    disabled={isLoading}
                />
                
                <Input 
                    label="Макс. участников (пусто = безлимит)" 
                    name="max_participants" 
                    type="number" 
                    min="0" 
                    value={formData.max_participants} 
                    onChange={handleChange} 
                    error={fieldErrors.max_participants} 
                    disabled={isLoading}
                />
                <Input 
                    value={user?.id || ''}
                    name="organizer"
                    type="hidden"
                />

                {/* Секция тегов */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-400">Теги</label>
                    
                    {/* Список доступных тегов */}
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-600 rounded-md bg-gray-800">
                        {availableTags.length === 0 ? (
                            <p className="text-gray-500 text-sm">Теги не найдены. Создайте первый тег ниже.</p>
                        ) : (
                            availableTags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleTagToggle(tag.id)}
                                    disabled={isLoading}
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
                            ))
                        )}
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
                                    disabled={isLoading || isCreatingTag}
                                    className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-white"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCreateTag();
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <input
                                    type="color"
                                    value={tagColor}
                                    onChange={(e) => setTagColor(e.target.value)}
                                    disabled={isLoading || isCreatingTag}
                                    className="w-10 h-10 border border-gray-600 rounded cursor-pointer disabled:cursor-not-allowed"
                                    title="Выберите цвет тега"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleCreateTag}
                                disabled={!tagInput.trim() || isLoading || isCreatingTag}
                                isLoading={isCreatingTag}
                                variant="secondary"
                            >
                                Создать
                            </Button>
                        </div>
                    </div>

                    {/* Показываем выбранные теги */}
                    {selectedTags.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-400 mb-1">Выбранные теги:</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedTags.map(tagId => {
                                    const tag = availableTags.find(t => t.id === tagId);
                                    return tag ? (
                                        <span
                                            key={tag.id}
                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            {tag.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 flex items-center space-x-3">
                    <Button type="submit" isLoading={isLoading}>
                        Создать мероприятие
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => navigate('/dashboard')} 
                        disabled={isLoading}
                    >
                        Отмена
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateEventPage;
