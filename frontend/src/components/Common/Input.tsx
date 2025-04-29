import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | null;
}

const Input: React.FC<InputProps> = ({
    label,
    id,
    name,
    type = 'text',
    className = '',
    error,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    const baseStyle = 'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm';
    const normalStyle = 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500';
    const errorStyle = 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';

    return (
        <div>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                id={inputId}
                name={name || inputId}
                type={type}
                className={`${baseStyle} ${error ? errorStyle : normalStyle} ${className}`}
                aria-invalid={!!error}
                aria-describedby={errorId}
                {...props}
            />
            {error && (
                <p id={errorId} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;