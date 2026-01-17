import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // initial check needed

    setAuth: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },
}));
