import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import QrScanner from '../../components/Organizer/QrScanner'; // Компонент сканера
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import type { Html5QrcodeResult } from 'html5-qrcode';

// Тип для ответа от check-in эндпоинта
interface CheckInResponse {
    message: string;
    registration: {
         id: string;
         student: { name: string; username: string }; // Упрощенно
         attended: boolean;
    };
}
interface CheckInError {
     error?: string; // Ошибка от бэкенда (404, 400)
     message?: string; // Сообщение от бэкенда (400 - уже отмечен)
     detail?: string; // Общая ошибка DRF
}


const CheckInPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // Блокировка на время запроса к API
    const [eventTitle, setEventTitle] = useState<string>('');
    const [isEventLoading, setIsEventLoading] = useState(true);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Загрузка названия события
    useEffect(() => {
         if (!eventId) return;
         setIsEventLoading(true);
         axiosInstance.get(`/events/${eventId}/`)
             .then(response => setEventTitle(response.data.title))
             .catch(err => console.error("Error fetching event title:", err))
             .finally(() => setIsEventLoading(false));
    }, [eventId]);

     // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
             if (processingTimeoutRef.current) {
                 clearTimeout(processingTimeoutRef.current);
             }
        };
    }, []);

    const handleScanSuccess = useCallback(async (decodedText: string, decodedResult: Html5QrcodeResult) => {
        if (isProcessing || !eventId) return; // Не обрабатывать, если уже идет запрос или нет eventId

        setIsProcessing(true); // Блокируем повторную обработку
        setLastResult({ type: 'info', message: 'Обработка QR...' });
        console.log(`Scanned: ${decodedText}`, decodedResult);

         // Очищаем предыдущий таймер если есть
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }

         // Извлекаем UUID регистрации (предполагаем, что QR содержит только UUID)
        const registrationId = decodedText.trim(); // Убираем пробелы
        // Простая проверка на формат UUID (опционально)
         const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
         if (!uuidRegex.test(registrationId)) {
            setLastResult({ type: 'error', message: 'Ошибка: Неверный формат QR-кода.' });
            setIsProcessing(false);
             // Устанавливаем таймер для очистки сообщения
            processingTimeoutRef.current = setTimeout(() => setLastResult(null), 3000);
            return;
         }

        try {
            const response = await axiosInstance.post<CheckInResponse>(`/events/${eventId}/check_in/`, {
                registration_id: registrationId
            });
            const studentName = response.data.registration.student.name || response.data.registration.student.username;
             setLastResult({ type: 'success', message: `Успех! ${studentName} отмечен(а).` });

        } catch (err: any) {
            console.error("Check-in error:", err.response?.data);
            const errorData: CheckInError = err.response?.data || {};
             setLastResult({ type: 'error', message: `Ошибка: ${errorData.error || errorData.message || errorData.detail || 'Не удалось отметить.'}` });
        } finally {
             setIsProcessing(false); // Разблокируем обработку
             // Устанавливаем таймер для очистки сообщения через 3 секунды
            processingTimeoutRef.current = setTimeout(() => setLastResult(null), 3000);
        }

    }, [eventId, isProcessing]); // Добавили isProcessing в зависимости

    return (
        <div className="max-w-xl mx-auto text-center">
             <div className="mb-4">
                 <Link to={`/events/${eventId}`} className="text-indigo-600 hover:text-indigo-800 text-sm">← К мероприятию</Link>
                 {isEventLoading ? (
                    <LoadingSpinner size="sm" />
                 ) : (
                     <h1 className="text-2xl font-bold text-gray-800 mt-1">Check-in: {eventTitle}</h1>
                 )}
            </div>

            {!isScanning ? (
                <Button onClick={() => setIsScanning(true)} size="lg" variant="primary">
                    Начать сканирование QR
                </Button>
            ) : (
                 <>
                     <Button onClick={() => setIsScanning(false)} size="lg" variant="secondary" className="mb-4">
                        Остановить сканирование
                    </Button>
                    {/* Компонент сканера */}
                     <QrScanner onScanSuccess={handleScanSuccess} />
                     {/* Область для вывода результата */}
                     <div className="mt-4 h-10"> {/* Фиксированная высота для предотвращения скачков */}
                         {isProcessing && lastResult?.type === 'info' && <LoadingSpinner size="sm" message={lastResult.message} />}
                         {lastResult && lastResult.type === 'success' && (
                            <p className="text-green-600 font-semibold">{lastResult.message}</p>
                         )}
                         {lastResult && lastResult.type === 'error' && (
                             <p className="text-red-600 font-semibold">{lastResult.message}</p>
                         )}
                     </div>
                 </>
            )}
        </div>
    );
};

export default CheckInPage;