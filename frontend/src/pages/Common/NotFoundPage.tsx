import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    return (
        <div className="text-center py-20">
            <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
            <p className="text-2xl font-semibold text-gray-700 mb-6">Страница не найдена</p>
            <p className="text-gray-500 mb-8">
                К сожалению, мы не смогли найти страницу, которую вы ищете.
            </p>
            <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300">
                Вернуться на главную
            </Link>
        </div>
    );
};

export default NotFoundPage;