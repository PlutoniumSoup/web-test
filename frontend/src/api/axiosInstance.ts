// src/api/axiosInstance.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // Импортируем стор

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Добавляет токен в каждый запрос
axiosInstance.interceptors.request.use(
    (config) => {
        // Получаем токен ИЗ Zustand store
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor (Опционально, для обработки обновления токена):
// axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;
//         // Если ошибка 401 и это не запрос на обновление токена
//         if (error.response?.status === 401 && !originalRequest._retry) {
//              originalRequest._retry = true;
//              try {
//                  const refreshToken = useAuthStore.getState().refreshToken;
//                  if (!refreshToken) { useAuthStore.getState().logout(); return Promise.reject(error); }
//
//                  const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
//                  useAuthStore.getState().setTokens(data.access, refreshToken); // Обновляем токен в сторе
//                  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
//                  originalRequest.headers['Authorization'] = `Bearer ${data.access}`; // Обновляем в оригинальном запросе
//                  return axiosInstance(originalRequest); // Повторяем оригинальный запрос
//              } catch (refreshError) {
//                  console.error("Token refresh failed:", refreshError);
//                  useAuthStore.getState().logout(); // Разлогиниваем при ошибке обновления
//                  // Редирект на логин или показ сообщения
//                  return Promise.reject(refreshError);
//              }
//          }
//          return Promise.reject(error);
//     }
// );

export default axiosInstance;