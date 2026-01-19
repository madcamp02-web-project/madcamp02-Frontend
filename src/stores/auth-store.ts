import { create } from 'zustand';
import { User } from '@/types/user';
import { authApi, LoginParams, SignupParams } from '@/lib/api/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginParams) => Promise<void>;
    loginAsGuest: () => Promise<void>;
    signup: (params: SignupParams) => Promise<void>;
    loginWithKakao: (accessToken: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authApi.login(credentials);
            // Assuming data structure: { accessToken: string, user: User }
            // Adjust based on actual API response. If response is just token, we might need to fetch user.
            const token = data.accessToken;
            if (token) {
                localStorage.setItem('accessToken', token);
                set({ token, isAuthenticated: true });
                await get().checkAuth(); // Fetch user details
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Login failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    signup: async (params) => {
        set({ isLoading: true, error: null });
        try {
            await authApi.signup(params);
            // Auto login after signup? Or require fresh login?
            // For now, let's assume we redirect to login or auto-login.
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Signup failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    loginWithKakao: async (accessToken) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authApi.kakaoLogin(accessToken);
            const token = data.accessToken;
            if (token) {
                localStorage.setItem('accessToken', token);
                set({ token, isAuthenticated: true });
                await get().checkAuth();
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Kakao login failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    loginAsGuest: async () => {
        console.log("LOGIN AS GUEST: Starting...");
        set({ isLoading: true, error: null });
        try {
            // Mock Login Delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const mockToken = "mock-token-dev-mode";
            localStorage.setItem('accessToken', mockToken);
            console.log("LOGIN AS GUEST: Token set in localStorage");

            set({
                token: mockToken,
                isAuthenticated: true,
                user: {
                    id: "guest-001",
                    email: "guest@example.com",
                    nickname: "Guest User",
                    provider: 'EMAIL',
                    profileImage: "/default-avatar.png"
                },
                isLoading: false
            });
            console.log("LOGIN AS GUEST: State updated");
        } finally {
            set({ isLoading: false });
        }
    },

    checkAuth: async () => {
        console.log("CHECK AUTH: Starting...");
        const token = localStorage.getItem('accessToken');
        console.log("CHECK AUTH: Token found:", token);

        if (!token) {
            set({ isLoading: false, isAuthenticated: false, user: null });
            return;
        }

        // Mock Token Bypass
        if (token === "mock-token-dev-mode") {
            console.log("CHECK AUTH: Mock token detected");
            set({
                token,
                isAuthenticated: true,
                user: {
                    id: "guest-001",
                    email: "guest@example.com",
                    nickname: "Guest User",
                    provider: 'EMAIL',
                    profileImage: "/default-avatar.png"
                },
                isLoading: false
            });
            return;
        }

        try {
            const userData = await authApi.me();
            set({ user: userData, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.log("CHECK AUTH: API Check failed");
            // Token invalid
            localStorage.removeItem('accessToken');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },
}));
