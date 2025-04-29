import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullscreen?: boolean;
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', fullscreen = false, message }) => {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const spinner = (
        <div className={`animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-indigo-600 ${sizeClasses[size]}`} />
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-50">
                {spinner}
                {message && <p className="mt-4 text-lg text-gray-700">{message}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-4">
             {spinner}
             {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;