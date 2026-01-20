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
    loginWithKakao: (accessToken: string) => Promise<boolean>; // isNewUser 반환
    loginWithGoogle: (idToken: string) => Promise<boolean>; // isNewUser 반환
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
            console.log('[AuthStore] Login 시작:', { email: credentials.email });
            const data = await authApi.login(credentials);
            console.log('[AuthStore] Login API 응답:', data);
            
            // Assuming data structure: { accessToken: string, refreshToken?: string, user: User }
            const token = data.accessToken;
            if (token) {
                localStorage.setItem('accessToken', token);
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                set({ token, isAuthenticated: true });
                
                // checkAuth는 실패해도 로그인은 유지 (토큰이 있으면 인증된 것으로 간주)
                try {
                    await get().checkAuth(); // Fetch user details
                } catch (checkError) {
                    console.warn('[AuthStore] checkAuth 실패, 하지만 토큰이 있으므로 로그인 유지:', checkError);
                    // checkAuth 실패해도 토큰이 있으면 인증된 것으로 간주
                }
            } else {
                throw new Error('Access token not received from server');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            console.error('[AuthStore] Login 실패:', errorMessage, error);
            set({ error: errorMessage, isAuthenticated: false, token: null });
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
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                set({ token, isAuthenticated: true });
                await get().checkAuth();
                // isNewUser 반환
                return data.isNewUser === true;
            }
            return false;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Kakao login failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authApi.googleLogin(idToken);
            const token = data.accessToken;
            if (token) {
                localStorage.setItem('accessToken', token);
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                set({ token, isAuthenticated: true });
                await get().checkAuth();
                // isNewUser 반환
                return data.isNewUser === true;
            }
            return false;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Google login failed' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    loginAsGuest: async () => {
        // 개발 환경에서만 사용 가능 (선택사항)
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Guest login is only available in development mode');
        }
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        if (!token) {
            console.log('[AuthStore] checkAuth: 토큰 없음');
            set({ isLoading: false, isAuthenticated: false, user: null });
            return;
        }

        try {
            console.log('[AuthStore] checkAuth: 사용자 정보 조회 시작');
            const userData = await authApi.me();
            console.log('[AuthStore] checkAuth: 사용자 정보 조회 성공:', userData);
            set({ user: userData, isAuthenticated: true, isLoading: false });
            
            // 인증 성공 시 user-store의 데이터 자동 로드
            if (typeof window !== 'undefined') {
                const { useUserStore } = await import('@/stores/user-store');
                const userStore = useUserStore.getState();
                // 병렬로 프로필, 인벤토리, 지갑 정보 로드 (에러는 무시)
                Promise.all([
                    userStore.fetchProfile().catch((err) => console.warn('[AuthStore] fetchProfile 실패:', err)),
                    userStore.fetchInventory().catch((err) => console.warn('[AuthStore] fetchInventory 실패:', err)),
                    userStore.fetchWallet().catch((err) => console.warn('[AuthStore] fetchWallet 실패:', err)),
                ]);
            }
        } catch (error: any) {
            console.error("[AuthStore] checkAuth: API Check failed", error);
            // Token invalid - 하지만 로그인 직후라면 토큰이 유효할 수 있으므로
            // 에러를 throw하지 않고 상태만 업데이트
            const errorMessage = error.response?.data?.message || error.message;
            if (error.response?.status === 401) {
                // 401 Unauthorized인 경우에만 토큰 제거
                console.log('[AuthStore] checkAuth: 401 에러, 토큰 제거');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            } else {
                // 다른 에러는 네트워크 문제일 수 있으므로 토큰 유지
                console.warn('[AuthStore] checkAuth: 네트워크 에러 가능성, 토큰 유지');
                set({ isLoading: false });
            }
            throw error; // 호출한 곳에서 처리할 수 있도록 에러 throw
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },
}));
