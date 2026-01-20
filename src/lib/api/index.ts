import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API URL이 설정되지 않은 경우 경고
if (!BASE_URL && typeof window !== 'undefined') {
    console.warn('[API] NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 환경 변수를 확인해주세요.');
}

// Axios config에 _retry 속성 추가를 위한 타입 확장
declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // For cookies if needed
    timeout: 30000, // 30초 타임아웃
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

// Response Interceptor: Handle 401 and other errors
api.interceptors.response.use(
    (response) => {
        // 백엔드 Redis 캐싱 헤더 처리 (Phase 3.6)
        const cacheStatus = response.headers['x-cache-status'];
        const cacheAge = response.headers['x-cache-age'];
        const dataFreshness = response.headers['x-data-freshness'];
        
        // 캐시 메타데이터를 response 객체에 추가하여 store에서 접근 가능하도록 함
        if (cacheStatus || cacheAge || dataFreshness) {
            (response as any).cacheMetadata = {
                status: cacheStatus,
                age: cacheAge ? parseInt(cacheAge, 10) : null,
                freshness: dataFreshness,
            };
        }
        
        return response;
    },
    async (error) => {
        const { response, config, code, message } = error;
        
        // 네트워크 오류 처리
        if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
            console.error('[API] Network error:', { code, message, url: config?.url });
            // 네트워크 오류는 그대로 전달 (각 store에서 처리)
            return Promise.reject(error);
        }

        // 401 Unauthorized 처리
        if (response && response.status === 401) {
            const authStore = useAuthStore.getState();
            const originalRequest = config;

            // Refresh token 시도 (refresh 엔드포인트가 아닌 경우에만)
            if (!originalRequest?.url?.includes('/auth/refresh') && !originalRequest?._retry) {
                originalRequest._retry = true;
                try {
                    // Refresh token API 호출
                    const refreshResponse = await api.post('/api/v1/auth/refresh');
                    const newToken = refreshResponse.data?.accessToken;
                    
                    if (newToken) {
                        // 새 토큰 저장
                        authStore.token = newToken;
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('accessToken', newToken);
                        }
                        
                        // 원래 요청 재시도
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh 실패 시 로그아웃
                    console.error('[API] Token refresh failed:', refreshError);
                    authStore.logout();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // Refresh 실패 또는 이미 시도한 경우 로그아웃
                authStore.logout();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }
        
        // 백엔드 Redis 캐싱 헤더 처리 (Phase 3.6) - 에러 응답에도 캐시 메타데이터가 있을 수 있음
        if (response) {
            const cacheStatus = response.headers['x-cache-status'];
            const cacheAge = response.headers['x-cache-age'];
            const dataFreshness = response.headers['x-data-freshness'];
            
            if (cacheStatus || cacheAge || dataFreshness) {
                (error.response as any).cacheMetadata = {
                    status: cacheStatus,
                    age: cacheAge ? parseInt(cacheAge, 10) : null,
                    freshness: dataFreshness,
                };
            }
        }
        
        // 기타 오류는 그대로 전달
        // 에러 로깅 개선: 유용한 정보만 출력
        const errorInfo: any = {
            url: config?.url || 'unknown',
            method: config?.method || 'unknown',
        };
        
        if (response) {
            errorInfo.status = response.status;
            errorInfo.statusText = response.statusText;
            errorInfo.message = response.data?.message || response.data?.error || message || 'Unknown error';
            // 응답 데이터가 있으면 일부만 로깅 (너무 큰 데이터 방지)
            if (response.data && typeof response.data === 'object') {
                errorInfo.responseData = JSON.stringify(response.data).substring(0, 200);
            }
        } else {
            errorInfo.code = code || 'UNKNOWN';
            errorInfo.message = message || 'Network error or unknown error';
        }
        
        // 개발 환경에서만 상세 로그 출력, 프로덕션에서는 간단히만
        if (process.env.NODE_ENV === 'development') {
            console.error('[API] Request failed:', errorInfo);
        } else {
            // 프로덕션에서는 간단히만 로그 (에러 추적용)
            console.error('[API] Request failed:', errorInfo.url, errorInfo.status || errorInfo.code, errorInfo.message);
        }
        
        return Promise.reject(error);
    }
);
