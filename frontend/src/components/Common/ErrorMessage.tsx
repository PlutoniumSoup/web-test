import React from 'react';

interface ErrorMessageProps {
    title?: string;
    message?: string | null;
    details?: any; // Можно выводить детали ошибки для отладки
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ title = "Ошибка", message, details }) => {
    if (!message) return null;

    return (
        <div className="rounded-md bg-red-50 p-4 my-4 border border-red-200">
            <div className="flex">
                <div className="flex-shrink-0">
                    {/* Heroicon name: mini/x-circle */}
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{title}</h3>
                    <div className="mt-2 text-sm text-red-700">
                        <p>{message}</p>
                        {/* Вывод деталей ошибки (опционально, для режима разработки) */}
                        {details && import.meta.env.DEV && (
                            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                                {JSON.stringify(details, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;