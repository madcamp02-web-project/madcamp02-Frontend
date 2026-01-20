import { api } from './index';

export interface LoginParams {
    email: string;
    password?: string;
}

export interface SignupParams {
    email: string;
    password?: string;
    nickname: string;
}

export const authApi = {
    // Standard Email Login
    login: async (credentials: LoginParams) => {
        const { data } = await api.post('/api/v1/auth/login', credentials);
        return data;
    },

    // Signup
    signup: async (params: SignupParams) => {
        const { data } = await api.post('/api/v1/auth/signup', params);
        return data;
    },

    // Hybrid Auth: Send Kakao Access Token to Backend
    kakaoLogin: async (accessToken: string) => {
        const { data } = await api.post('/api/v1/auth/oauth/kakao', { accessToken });
        return data;
    },

    // Hybrid Auth: Send Google ID Token to Backend
    googleLogin: async (idToken: string) => {
        const { data } = await api.post('/api/v1/auth/oauth/google', { 
            provider: 'google',
            idToken 
        });
        return data;
    },

    // Refresh Token (if manually called)
    refreshToken: async () => {
        const { data } = await api.post('/api/v1/auth/refresh');
        return data;
    },

    // Check Auth (Me) - 인증 컨텍스트 전용
    me: async () => {
        const { data } = await api.get('/api/v1/auth/me');
        return data;
    }
};
