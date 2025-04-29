// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/entities'; // Определите тип User в types/entities.ts

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Флаг для загрузки данных пользователя
    setTokens: (access: string, refresh: string) => void;
    setUser: (user: User | null) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    // persist сохраняет состояние в localStorage (или sessionStorage)
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isLoading: true, // Начинаем с загрузки
            setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
            setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
            logout: () => set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false }),
            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'studafishka-auth', // Имя ключа в хранилище
            storage: createJSONStorage(() => localStorage), // Используем localStorage
            // Указываем, какие части состояния сохранять (не храним user и isLoading)
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
            // Функция, выполняемая после восстановления состояния
            onRehydrateStorage: () => (state) => {
                 // Если есть токен после загрузки, но нет пользователя - ставим isLoading=true
                if (state?.accessToken && !state.user) {
                    state.isLoading = true;
                } else {
                     if (state) {
                         state.isLoading = false; // Иначе загрузка завершена
                     }
                }
            },
        }
    )
);

// Инициализация: проверяем наличие токена и загружаем пользователя, если нужно
// Вызывать эту функцию один раз в App.tsx
export const initializeAuth = async () => {
    const { accessToken, setUser, logout, setLoading } = useAuthStore.getState();
    if (accessToken) {
        setLoading(true);
        try {
            // Используем axiosInstance, который уже настроен с интерцептором
            const { data: user } = await import('../api/axiosInstance').then(m => m.default.get<User>('/users/me/'));
            setUser(user);
        } catch (error) {
            console.error('Failed to fetch user on init:', error);
            logout(); // Разлогинить, если токен невалидный
        } finally {
            // setLoading(false); // setUser уже устанавливает isLoading в false
        }
    } else {
         setLoading(false); // Нет токена - загрузка не нужна
    }
};