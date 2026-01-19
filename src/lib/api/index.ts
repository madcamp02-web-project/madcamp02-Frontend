import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // For cookies if needed
});

// Request Interceptor: Add Bearer Token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response } = error;
        if (response && response.status === 401) {
            // Token expired or invalid
            // TODO: Implement refresh token logic if supported
            useAuthStore.getState().logout();
            // Optional: Redirect to login handled by UI reacting to store state
        }
        return Promise.reject(error);
    }
);
