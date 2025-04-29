// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Common/Navbar'; // Создадим позже

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-4">
                <Outlet /> {/* Здесь будут рендериться дочерние роуты */}
            </main>
            {/* Можно добавить Footer */}
        </div>
    );
};

export default MainLayout;