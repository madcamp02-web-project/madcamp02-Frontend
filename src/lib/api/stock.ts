import { api } from './index';
import {
    MarketIndicesResponse,
    MarketNewsResponse,
    MarketMoversResponse,
    StockSearchResponse,
    StockQuoteResponse,
    OrderbookResponse,
    CandlesResponse,
} from '@/types/api';

export const stockApi = {
    // Market Indices
    getIndices: async (): Promise<MarketIndicesResponse> => {
        const { data } = await api.get<MarketIndicesResponse>('/api/v1/market/indices');
        return data;
    },

    // Market News
    getNews: async (): Promise<MarketNewsResponse> => {
        const { data } = await api.get<MarketNewsResponse>('/api/v1/market/news');
        return data;
    },

    // Market Movers
    getMovers: async (): Promise<MarketMoversResponse> => {
        const { data } = await api.get<MarketMoversResponse>('/api/v1/market/movers');
        return data;
    },

    // Search Stocks
    search: async (keyword: string): Promise<StockSearchResponse> => {
        const { data } = await api.get<StockSearchResponse>(`/api/v1/stock/search?keyword=${encodeURIComponent(keyword)}`);
        return data;
    },

    // Get Quote (Current Price)
    getQuote: async (ticker: string): Promise<StockQuoteResponse> => {
        const { data } = await api.get<StockQuoteResponse>(`/api/v1/stock/quote/${encodeURIComponent(ticker)}`);
        return data;
    },

    // Get Candles
    // 백엔드 API 스펙 (V8 마이그레이션 이후):
    // - ticker (path): 종목 심볼
    // - resolution (query): 'd' (daily), 'w' (weekly), 'm' (monthly) - DB의 period 컬럼과 동일
    // - from (query): 시작 시간 ISO-8601 형식 (예: 2026-01-19T00:00:00Z)
    // - to (query): 종료 시간 ISO-8601 형식 (예: 2026-01-19T23:59:59Z)
    // 최대 2년(730일)까지 호출 가능
    // 
    // 백엔드 배치 로드 전략:
    // - d 데이터가 없을 때: batchLoadAllResolutions() 실행 (d, w, m 모두 한번에 로드, Quota 1회)
    // - d는 있지만 w, m 중 일부가 없을 때: batchLoadMissingResolutions() 실행 (없는 것만 로드, Quota 1회)
    // - 요청된 resolution만 없을 때: loadSingleResolution() 실행 (해당 resolution만 로드, Quota 1회)
    getCandles: async (ticker: string, timeframe?: string): Promise<CandlesResponse> => {
        if (!timeframe) {
            const { data } = await api.get<CandlesResponse>(`/api/v1/stock/candles/${encodeURIComponent(ticker)}`);
            return data;
        }

        // timeframe을 백엔드 API 형식으로 변환
        // 프론트엔드: '1d', '1w', '1m', '3m', '1y'
        // 백엔드: resolution ('d', 'w', 'm') + from/to (ISO-8601)
        
        // 날짜 계산 헬퍼 함수 (ISO-8601 형식으로 변환)
        // 최대 2년(730일)까지 호출 가능
        const getDateRange = (days: number): { from: string; to: string } => {
            const to = new Date();
            const from = new Date();
            
            // 최대 2년(730일) 제한
            const maxDays = 730;
            const actualDays = Math.min(days, maxDays);
            
            from.setDate(from.getDate() - actualDays);
            
            // ISO-8601 형식으로 변환 (예: 2026-01-19T00:00:00Z)
            const formatISO8601 = (date: Date): string => {
                return date.toISOString();
            };
            
            return {
                from: formatISO8601(from),
                to: formatISO8601(to),
            };
        };

        // timeframe → resolution 매핑 및 날짜 범위 설정
        // 프론트엔드: 'd' (Daily), 'w' (Weekly), 'm' (Monthly)
        // 백엔드 resolution: 'd' (daily), 'w' (weekly), 'm' (monthly)
        // 모든 resolution에 대해 최대 2년(730일) 범위로 데이터 요청
        let resolution: string;
        let dateRange: { from: string; to: string };
        
        switch (timeframe) {
            case 'd':
                resolution = 'd'; // 일봉
                dateRange = getDateRange(730); // 최대 2년
                break;
            case 'w':
                resolution = 'w'; // 주봉
                dateRange = getDateRange(730); // 최대 2년
                break;
            case 'm':
                resolution = 'm'; // 월봉
                dateRange = getDateRange(730); // 최대 2년
                break;
            default:
                // 기본값: 일봉, 최대 2년
                resolution = 'd';
                dateRange = getDateRange(730);
        }

        // 백엔드 API 형식으로 파라미터 구성
        const params = new URLSearchParams();
        params.append('resolution', resolution);
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
        
        const url = `/api/v1/stock/candles/${encodeURIComponent(ticker)}?${params.toString()}`;
        
        // 테스트용: 실제 전송되는 URL 로깅
        console.log('[stockApi.getCandles] 요청 URL:', url);
        console.log('[stockApi.getCandles] 파라미터:', {
            ticker,
            timeframe,
            resolution,
            from: dateRange.from,
            to: dateRange.to,
        });
        
        try {
            const { data } = await api.get<CandlesResponse>(url);
            console.log('[stockApi.getCandles] 응답 데이터:', {
                ticker: data.ticker,
                resolution: data.resolution,
                itemsCount: data.items?.length || 0,
                hasWarning: !!data.warning,
                isStale: data.stale,
                warning: data.warning,
                fullResponse: data, // 전체 응답 로깅
            });
            
            // items가 비어있고 warning이 있으면 로깅
            if ((!data.items || data.items.length === 0) && data.warning) {
                console.warn('[stockApi.getCandles] items가 비어있고 warning이 있습니다:', data.warning);
            }
            
            return data;
        } catch (error: any) {
            console.error('[stockApi.getCandles] API 호출 실패:', {
                url,
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                responseData: error.response?.data, // 응답 데이터도 로깅
            });
            throw error;
        }
    },

    // Get Orderbook (Snapshot)
    getOrderbook: async (ticker: string): Promise<OrderbookResponse> => {
        const { data } = await api.get<OrderbookResponse>(`/api/v1/stock/orderbook/${encodeURIComponent(ticker)}`);
        return data;
    },
};
