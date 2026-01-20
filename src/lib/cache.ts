/**
 * 클라이언트 사이드 캐시 유틸리티
 * localStorage 기반 캐싱으로 API 실패 시에도 이전 데이터를 안전하게 표시
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresIn: number; // 밀리초 단위
}

const CACHE_PREFIX = 'madcamp_cache_';
const DEFAULT_EXPIRES_IN = 5 * 60 * 1000; // 기본 5분

/**
 * 캐시 키 생성
 */
function getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
}

/**
 * 데이터를 캐시에 저장
 * @param key 캐시 키
 * @param data 저장할 데이터
 * @param expiresIn 만료 시간 (밀리초, 기본값: 5분)
 */
export function setCache<T>(key: string, data: T, expiresIn: number = DEFAULT_EXPIRES_IN): void {
    try {
        const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresIn,
        };
        const cacheKey = getCacheKey(key);
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
        // localStorage 용량 초과 등 에러는 조용히 무시
        console.warn('[Cache] Failed to set cache:', error);
    }
}

/**
 * 캐시에서 데이터 조회
 * @param key 캐시 키
 * @returns 캐시된 데이터 또는 null (만료되었거나 없으면)
 */
export function getCache<T>(key: string): T | null {
    try {
        const cacheKey = getCacheKey(key);
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) {
            return null;
        }

        const cacheItem: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();
        const age = now - cacheItem.timestamp;

        // 만료 확인
        if (age > cacheItem.expiresIn) {
            // 만료된 캐시 삭제
            localStorage.removeItem(cacheKey);
            return null;
        }

        return cacheItem.data;
    } catch (error) {
        // 파싱 에러 등은 조용히 무시하고 null 반환
        console.warn('[Cache] Failed to get cache:', error);
        return null;
    }
}

/**
 * 캐시 삭제
 * @param key 캐시 키
 */
export function removeCache(key: string): void {
    try {
        const cacheKey = getCacheKey(key);
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.warn('[Cache] Failed to remove cache:', error);
    }
}

/**
 * 모든 캐시 삭제 (선택적)
 */
export function clearAllCache(): void {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('[Cache] Failed to clear cache:', error);
    }
}

/**
 * 캐시 키 상수
 */
export const CACHE_KEYS = {
    MARKET_INDICES: 'market_indices',
    MARKET_MOVERS: 'market_movers',
    MARKET_NEWS: 'market_news',
    STOCK_QUOTE: (ticker: string) => `stock_quote_${ticker}`,
    STOCK_CANDLES: (ticker: string) => `stock_candles_${ticker}`,
    STOCK_ORDERBOOK: (ticker: string) => `stock_orderbook_${ticker}`,
} as const;
