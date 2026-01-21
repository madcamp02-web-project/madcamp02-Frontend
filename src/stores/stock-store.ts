import { create } from 'zustand';
import { StockPrice } from '@/types/stock';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { stockApi } from '@/lib/api/stock';
import { userApi } from '@/lib/api/user';
import {
    MarketIndicesResponse,
    MarketMoversResponse,
    MarketNewsResponse,
    StockSearchResponse,
    StockQuoteResponse,
    OrderbookResponse,
    CandlesResponse,
    UserWatchlistResponse,
} from '@/types/api';
import { getCache, setCache, CACHE_KEYS } from '@/lib/cache';

// Immer에서 Map/Set을 안전하게 쓰기 위한 플러그인 활성화
enableMapSet();

// 백엔드 Redis 캐시 상태 (Phase 3.6)
interface BackendCacheMetadata {
    status: 'HIT' | 'MISS' | 'STALE' | null;
    age: number | null; // 초 단위
    freshness: 'FRESH' | 'STALE' | 'EXPIRED' | null;
}

interface StockState {
    // Real-time prices
    prices: Record<string, StockPrice>; // ticker -> price
    // Market data
    indices: MarketIndicesResponse | null;
    movers: MarketMoversResponse | null;
    news: MarketNewsResponse | null;
    // Watchlist
    watchlist: string[]; // ticker list
    // Search results
    searchResults: StockSearchResponse | null;
    // Current quote
    currentQuote: StockQuoteResponse | null;
    // Orderbook
    orderbook: OrderbookResponse | null;
    // Candles
    candles: CandlesResponse | null;
    // 실시간 trade 데이터 (WebSocket에서 수집)
    realtimeTrades: Map<string, Array<{ price: number; volume: number; timestamp: number }>>; // ticker -> trades[]
    // Loading states
    isLoading: boolean;
    error: string | null;
    // 프론트엔드 localStorage 캐시 상태 (각 데이터가 캐시에서 로드되었는지)
    isUsingCache: {
        indices: boolean;
        movers: boolean;
        news: boolean;
    };
    // 백엔드 Redis 캐시 상태 (Phase 3.6)
    backendCache: {
        indices: BackendCacheMetadata | null;
        movers: BackendCacheMetadata | null;
        news: BackendCacheMetadata | null;
    };

    // Actions
    updatePrice: (price: StockPrice) => void;
    fetchIndices: () => Promise<void>;
    fetchMovers: () => Promise<void>;
    fetchNews: () => Promise<void>;
    searchStocks: (keyword: string) => Promise<void>;
    fetchQuote: (ticker: string) => Promise<void>;
    fetchCandles: (ticker: string, timeframe?: string) => Promise<CandlesResponse | void>;
    fetchOrderbook: (ticker: string) => Promise<void>;
    loadWatchlist: () => Promise<void>;
    addToWatchlist: (ticker: string) => Promise<void>;
    removeFromWatchlist: (ticker: string) => Promise<void>;
    updateIndices: (indices: MarketIndicesResponse) => void;
    updateQuoteFromWebSocket: (ticker: string, price: number, volume: number, timestamp: number) => void;
    updateQuoteFromWebSocketMessage: (ticker: string, messageData: any) => void;
    addRealtimeTrade: (ticker: string, price: number, volume: number, timestamp: number) => void;
    clearRealtimeTrades: (ticker: string) => void;

    // Global Selection
    selectedTicker: string;
    setSelectedTicker: (ticker: string) => void;
}

export const useStockStore = create<StockState>()(
    immer((set, get) => ({
        prices: {},
        indices: null,
        movers: null,
        news: null,
        watchlist: [],
        searchResults: null,
        currentQuote: null,
        orderbook: null,
        candles: null,
        realtimeTrades: new Map(),
        isLoading: false,
        error: null,
        isUsingCache: {
            indices: false,
            movers: false,
            news: false,
        },
        backendCache: {
            indices: null,
            movers: null,
            news: null,
        },
        selectedTicker: 'AAPL',

        updatePrice: (price) =>
            set((state) => {
                state.prices[price.ticker] = price;
            }),

        updateIndices: (indices) =>
            set((state) => {
                state.indices = indices;
                // WebSocket으로 실시간 업데이트가 오면 캐시도 갱신
                setCache(CACHE_KEYS.MARKET_INDICES, indices);
                state.isUsingCache.indices = false; // 실시간 데이터 사용 중
            }),

        setSelectedTicker: (ticker) =>
            set((state) => {
                state.selectedTicker = ticker;
            }),

        // 실시간 trade 데이터 추가 (차트용)
        addRealtimeTrade: (ticker, price, volume, timestamp) =>
            set((state) => {
                if (!state.realtimeTrades.has(ticker)) {
                    state.realtimeTrades.set(ticker, []);
                }
                const trades = state.realtimeTrades.get(ticker)!;

                // 최근 1시간치 trade만 유지 (메모리 관리)
                const oneHourAgo = timestamp - (60 * 60 * 1000);
                const filteredTrades = trades.filter(t => t.timestamp > oneHourAgo);

                // 새 trade 추가
                filteredTrades.push({ price, volume, timestamp });

                state.realtimeTrades.set(ticker, filteredTrades);
            }),

        // 실시간 trade 데이터 초기화
        clearRealtimeTrades: (ticker) =>
            set((state) => {
                state.realtimeTrades.delete(ticker);
            }),

        // WebSocket에서 받은 실시간 가격 데이터로 currentQuote 업데이트 (기존 호환성 유지)
        updateQuoteFromWebSocket: (ticker, price, volume, timestamp) =>
            set((state) => {
                // currentQuote가 현재 ticker에 대한 것이면 업데이트
                if (state.currentQuote && state.currentQuote.ticker === ticker) {
                    const previousClose = state.currentQuote.previousClose || state.currentQuote.price || 0;
                    const change = previousClose > 0 ? price - previousClose : 0;
                    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

                    // 시가(Open): 하루의 첫 거래 가격이므로, 아직 설정되지 않았거나 현재가가 더 낮으면 업데이트
                    const currentOpen = state.currentQuote.open;
                    const newOpen = currentOpen === undefined || currentOpen === 0 ? price : currentOpen;

                    // 고가(High): 현재가가 기존 고가보다 높으면 업데이트
                    const currentHigh = state.currentQuote.high || price;
                    const newHigh = Math.max(currentHigh, price);

                    // 저가(Low): 현재가가 기존 저가보다 낮으면 업데이트
                    const currentLow = state.currentQuote.low || price;
                    const newLow = Math.min(currentLow, price);

                    // 거래량(Volume): 실시간으로 누적
                    const currentVolume = state.currentQuote.volume || 0;
                    const newVolume = volume > 0 ? Math.max(currentVolume, volume) : currentVolume;

                    state.currentQuote = {
                        ...state.currentQuote,
                        price,
                        open: newOpen,
                        high: newHigh,
                        low: newLow,
                        change,
                        changePercent,
                        volume: newVolume,
                    };
                }

                // prices 업데이트
                const existingPrice = state.prices[ticker];
                const previousPrice = state.currentQuote?.previousClose || existingPrice?.price || 0;
                const change = previousPrice > 0 ? price - previousPrice : 0;
                const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

                state.prices[ticker] = {
                    ticker,
                    price,
                    change,
                    changePercent,
                    volume,
                    timestamp,
                };
            }),

        // WebSocket에서 받은 Quote 메시지로 currentQuote 업데이트 (백엔드 Quote API 폴링 데이터)
        // 메시지 구조: { ticker, price, open, high, low, close, previousClose, change, changePercent, volume, ts, rawType: "quote" }
        updateQuoteFromWebSocketMessage: (ticker, messageData) =>
            set((state) => {
                // rawType이 "quote"인 경우에만 Quote 메시지로 처리
                if (messageData.rawType === 'quote') {
                    // currentQuote가 현재 ticker에 대한 것이면 업데이트
                    if (state.currentQuote && state.currentQuote.ticker === ticker) {
                        state.currentQuote = {
                            ...state.currentQuote,
                            price: messageData.price || messageData.close || state.currentQuote.price,
                            open: messageData.open !== undefined ? messageData.open : state.currentQuote.open,
                            high: messageData.high !== undefined ? messageData.high : state.currentQuote.high,
                            low: messageData.low !== undefined ? messageData.low : state.currentQuote.low,
                            previousClose: messageData.previousClose !== undefined ? messageData.previousClose : state.currentQuote.previousClose,
                            change: messageData.change !== undefined ? messageData.change : state.currentQuote.change,
                            changePercent: messageData.changePercent !== undefined ? messageData.changePercent : state.currentQuote.changePercent,
                            volume: messageData.volume !== undefined && messageData.volume > 0 ? messageData.volume : state.currentQuote.volume,
                        };
                    }

                    // prices도 업데이트 (관심종목 목록 표시용)
                    // Quote 메시지에는 모든 OHLC 데이터가 포함되어 있으므로 prices에 저장
                    const price = messageData.price || messageData.close || 0;
                    const change = messageData.change !== undefined ? messageData.change : 0;
                    const changePercent = messageData.changePercent !== undefined ? messageData.changePercent : 0;
                    const volume = messageData.volume || 0;
                    const timestamp = messageData.ts || Date.now();

                    // prices 업데이트 (관심종목 목록에서 실시간 가격 표시용)
                    state.prices[ticker] = {
                        ticker,
                        price,
                        change,
                        changePercent,
                        volume,
                        timestamp,
                    };

                    console.log(`[updateQuoteFromWebSocketMessage] prices 업데이트 (${ticker}):`, {
                        price,
                        change,
                        changePercent,
                        volume,
                    });
                } else {
                    // rawType이 "trade"이거나 없는 경우 기존 로직 사용
                    const price = messageData.price || 0;
                    const volume = messageData.volume || 0;
                    const timestamp = messageData.ts || Date.now();

                    // 기존 updateQuoteFromWebSocket 로직 호출
                    const previousClose = state.currentQuote?.previousClose || state.prices[ticker]?.price || 0;
                    const change = previousClose > 0 ? price - previousClose : 0;
                    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

                    if (state.currentQuote && state.currentQuote.ticker === ticker) {
                        const currentOpen = state.currentQuote.open;
                        const newOpen = currentOpen === undefined || currentOpen === 0 ? price : currentOpen;
                        const currentHigh = state.currentQuote.high || price;
                        const newHigh = Math.max(currentHigh, price);
                        const currentLow = state.currentQuote.low || price;
                        const newLow = Math.min(currentLow, price);
                        const currentVolume = state.currentQuote.volume || 0;
                        const newVolume = volume > 0 ? Math.max(currentVolume, volume) : currentVolume;

                        state.currentQuote = {
                            ...state.currentQuote,
                            price,
                            open: newOpen,
                            high: newHigh,
                            low: newLow,
                            change,
                            changePercent,
                            volume: newVolume,
                        };
                    }

                    state.prices[ticker] = {
                        ticker,
                        price,
                        change,
                        changePercent,
                        volume,
                        timestamp,
                    };
                }
            }),

        fetchIndices: async () => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            const cached = getCache<MarketIndicesResponse>(CACHE_KEYS.MARKET_INDICES);
            if (cached) {
                set((state) => {
                    state.indices = cached;
                    state.isUsingCache.indices = true;
                });
            }

            try {
                const response = await stockApi.getIndices();

                // 백엔드 캐시 메타데이터 추출 (Phase 3.6)
                const cacheMetadata = (response as any).cacheMetadata as BackendCacheMetadata | undefined;

                // 성공 시 프론트엔드 캐시 업데이트 및 상태 업데이트
                setCache(CACHE_KEYS.MARKET_INDICES, response);
                set((state) => {
                    state.indices = response;
                    state.isLoading = false;
                    state.error = null;
                    state.isUsingCache.indices = false; // 최신 데이터 사용 중
                    // 백엔드 캐시 상태 저장
                    state.backendCache.indices = cacheMetadata || null;
                });
            } catch (error: any) {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '지수 데이터를 불러오는데 실패했습니다');
                console.error('[fetchIndices] Error:', error);

                // 백엔드에서 STALE 데이터를 반환했는지 확인 (Phase 3.6)
                const cacheMetadata = (error.response as any)?.cacheMetadata as BackendCacheMetadata | undefined;
                if (cacheMetadata?.status === 'STALE' && error.response?.data) {
                    // 백엔드가 STALE 데이터를 반환한 경우 (에러가 아니지만 catch로 들어옴)
                    setCache(CACHE_KEYS.MARKET_INDICES, error.response.data);
                    set((state) => {
                        state.indices = error.response.data;
                        state.isLoading = false;
                        state.error = null;
                        state.isUsingCache.indices = false; // 백엔드에서 받은 데이터
                        state.backendCache.indices = cacheMetadata;
                    });
                    return;
                }

                // 프론트엔드 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<MarketIndicesResponse>(CACHE_KEYS.MARKET_INDICES);
                if (cached) {
                    set((state) => {
                        state.indices = cached;
                        state.isLoading = false;
                        // 캐시된 데이터를 사용 중이므로 에러는 표시하지 않음
                        state.error = null;
                        state.isUsingCache.indices = true;
                        state.backendCache.indices = null; // 백엔드 응답 없음
                    });
                } else {
                    // 캐시도 없으면 에러 표시
                    set((state) => {
                        state.error = errorMessage;
                        state.isLoading = false;
                        state.isUsingCache.indices = false;
                        state.backendCache.indices = null;
                    });
                }
            }
        },

        fetchMovers: async () => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            const cached = getCache<MarketMoversResponse>(CACHE_KEYS.MARKET_MOVERS);
            if (cached) {
                set((state) => {
                    state.movers = cached;
                    state.isUsingCache.movers = true;
                });
            }

            try {
                const response = await stockApi.getMovers();

                // 백엔드 캐시 메타데이터 추출 (Phase 3.6)
                const cacheMetadata = (response as any).cacheMetadata as BackendCacheMetadata | undefined;

                // 성공 시 프론트엔드 캐시 업데이트 및 상태 업데이트
                setCache(CACHE_KEYS.MARKET_MOVERS, response);
                set((state) => {
                    state.movers = response;
                    state.isLoading = false;
                    state.error = null;
                    state.isUsingCache.movers = false; // 최신 데이터 사용 중
                    // 백엔드 캐시 상태 저장
                    state.backendCache.movers = cacheMetadata || null;
                });
            } catch (error: any) {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '시장 동향 데이터를 불러오는데 실패했습니다');
                console.error('[fetchMovers] Error:', error);

                // 백엔드에서 STALE 데이터를 반환했는지 확인 (Phase 3.6)
                const cacheMetadata = (error.response as any)?.cacheMetadata as BackendCacheMetadata | undefined;
                if (cacheMetadata?.status === 'STALE' && error.response?.data) {
                    // 백엔드가 STALE 데이터를 반환한 경우
                    setCache(CACHE_KEYS.MARKET_MOVERS, error.response.data);
                    set((state) => {
                        state.movers = error.response.data;
                        state.isLoading = false;
                        state.error = null;
                        state.isUsingCache.movers = false;
                        state.backendCache.movers = cacheMetadata;
                    });
                    return;
                }

                // 프론트엔드 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<MarketMoversResponse>(CACHE_KEYS.MARKET_MOVERS);
                if (cached) {
                    set((state) => {
                        state.movers = cached;
                        state.isLoading = false;
                        state.error = null;
                        state.isUsingCache.movers = true;
                        state.backendCache.movers = null;
                    });
                } else {
                    // 캐시도 없으면 에러 표시
                    set((state) => {
                        state.error = errorMessage;
                        state.isLoading = false;
                        state.isUsingCache.movers = false;
                        state.backendCache.movers = null;
                    });
                }
            }
        },

        fetchNews: async () => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            const cached = getCache<MarketNewsResponse>(CACHE_KEYS.MARKET_NEWS);
            if (cached) {
                set((state) => {
                    state.news = cached;
                    state.isUsingCache.news = true;
                });
            }

            try {
                const response = await stockApi.getNews();

                // 백엔드 캐시 메타데이터 추출 (Phase 3.6)
                const cacheMetadata = (response as any).cacheMetadata as BackendCacheMetadata | undefined;

                // 성공 시 프론트엔드 캐시 업데이트 및 상태 업데이트
                setCache(CACHE_KEYS.MARKET_NEWS, response);
                set((state) => {
                    state.news = response;
                    state.isLoading = false;
                    state.error = null;
                    state.isUsingCache.news = false; // 최신 데이터 사용 중
                    // 백엔드 캐시 상태 저장
                    state.backendCache.news = cacheMetadata || null;
                });
            } catch (error: any) {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '뉴스 데이터를 불러오는데 실패했습니다');
                console.error('[fetchNews] Error:', error);

                // 백엔드에서 STALE 데이터를 반환했는지 확인 (Phase 3.6)
                const cacheMetadata = (error.response as any)?.cacheMetadata as BackendCacheMetadata | undefined;
                if (cacheMetadata?.status === 'STALE' && error.response?.data) {
                    // 백엔드가 STALE 데이터를 반환한 경우
                    setCache(CACHE_KEYS.MARKET_NEWS, error.response.data);
                    set((state) => {
                        state.news = error.response.data;
                        state.isLoading = false;
                        state.error = null;
                        state.isUsingCache.news = false;
                        state.backendCache.news = cacheMetadata;
                    });
                    return;
                }

                // 프론트엔드 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<MarketNewsResponse>(CACHE_KEYS.MARKET_NEWS);
                if (cached) {
                    set((state) => {
                        state.news = cached;
                        state.isLoading = false;
                        state.error = null;
                        state.isUsingCache.news = true;
                        state.backendCache.news = null;
                    });
                } else {
                    // 캐시도 없으면 에러 표시
                    set((state) => {
                        state.error = errorMessage;
                        state.isLoading = false;
                        state.isUsingCache.news = false;
                        state.backendCache.news = null;
                    });
                }
            }
        },

        searchStocks: async (keyword: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });
            try {
                const response = await stockApi.search(keyword);
                set((state) => {
                    state.searchResults = response;
                    state.isLoading = false;
                });
            } catch (error: any) {
                set((state) => {
                    state.error = error.response?.data?.message || 'Failed to search stocks';
                    state.isLoading = false;
                });
                throw error;
            }
        },

        fetchQuote: async (ticker: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            const cached = getCache<StockQuoteResponse>(CACHE_KEYS.STOCK_QUOTE(ticker));
            if (cached) {
                set((state) => {
                    state.currentQuote = cached;
                    state.prices[ticker] = {
                        ticker: cached.ticker,
                        price: cached.price,
                        change: cached.change,
                        changePercent: cached.changePercent,
                        volume: cached.volume || 0,
                        timestamp: Date.now(),
                    };
                });
            }

            try {
                const response = await stockApi.getQuote(ticker);
                console.log(`[fetchQuote] API 응답 (${ticker}):`, response);
                // 성공 시 캐시 업데이트 및 상태 업데이트
                setCache(CACHE_KEYS.STOCK_QUOTE(ticker), response);
                set((state) => {
                    state.currentQuote = response;
                    // Also update prices for real-time display
                    state.prices[ticker] = {
                        ticker: response.ticker,
                        price: response.price,
                        change: response.change,
                        changePercent: response.changePercent,
                        volume: response.volume || 0,
                        timestamp: Date.now(),
                    };
                    state.isLoading = false;
                    state.error = null;
                });
            } catch (error: any) {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '종목 정보를 불러오는데 실패했습니다');
                console.error('[fetchQuote] Error:', error);

                // 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<StockQuoteResponse>(CACHE_KEYS.STOCK_QUOTE(ticker));
                if (cached) {
                    set((state) => {
                        state.currentQuote = cached;
                        state.prices[ticker] = {
                            ticker: cached.ticker,
                            price: cached.price,
                            change: cached.change,
                            changePercent: cached.changePercent,
                            volume: cached.volume || 0,
                            timestamp: Date.now(),
                        };
                        state.isLoading = false;
                        // 캐시된 데이터를 사용 중이므로 에러는 표시하지 않음
                        state.error = null;
                    });
                } else {
                    // 캐시도 없으면 에러 표시하지 않음 - WebSocket으로 실시간 데이터 수신
                    set((state) => {
                        state.error = null; // 에러 표시하지 않음
                        state.isLoading = false;
                    });
                }
                // 에러를 다시 throw하지 않아서 UI가 계속 표시됨
            }
        },

        fetchCandles: async (ticker: string, timeframe?: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            // 백엔드 V8 마이그레이션 이후: resolution별로 캐시 키 구분 (d, w, m)
            const cacheKey = timeframe
                ? `${CACHE_KEYS.STOCK_CANDLES(ticker)}_${timeframe}`
                : CACHE_KEYS.STOCK_CANDLES(ticker);
            const cached = getCache<CandlesResponse>(cacheKey);
            if (cached) {
                set((state) => {
                    state.candles = cached;
                });
            }

            try {
                const response = await stockApi.getCandles(ticker, timeframe);
                console.log(`[fetchCandles] API 응답 (${ticker}, ${timeframe}):`, {
                    ticker: response.ticker,
                    resolution: response.resolution, // 백엔드 period 값: 'd', 'w', 'm'
                    itemsCount: response.items?.length || 0,
                    warning: response.warning,
                    stale: response.stale,
                    firstItem: response.items?.[0],
                    lastItem: response.items?.[response.items.length - 1],
                    fullResponse: response, // 전체 응답 로깅
                });

                // 백엔드 배치 로드 전략에 따라:
                // - d 요청 시 d가 없으면 d, w, m 모두 로드됨 (Quota 1회)
                // - w 요청 시 w가 없으면 w만 로드됨 (Quota 1회)
                // - m 요청 시 m이 없으면 m만 로드됨 (Quota 1회)
                // 응답의 resolution은 요청한 resolution과 일치해야 함
                if (timeframe && response.resolution !== timeframe) {
                    console.warn(`[fetchCandles] Resolution 불일치: 요청=${timeframe}, 응답=${response.resolution}`);
                }

                // items가 비어있고 warning이 있으면 경고 로깅
                if ((!response.items || response.items.length === 0) && response.warning) {
                    console.warn(`[fetchCandles] items가 비어있습니다. Warning: ${response.warning}`);
                }

                // 성공 시 캐시 업데이트 및 상태 업데이트 (items가 비어있어도 응답은 저장)
                // resolution별로 캐시 키 구분하여 저장
                setCache(cacheKey, response);
                set((state) => {
                    state.candles = response;
                    state.isLoading = false;
                    state.error = null;
                });

                return response; // 응답 반환
            } catch (error: any) {
                const errorMessage = error.response?.data?.message
                    || error.message
                    || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '차트 데이터를 불러오는데 실패했습니다');
                console.error('[fetchCandles] Error:', error);

                // 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<CandlesResponse>(cacheKey);
                if (cached) {
                    set((state) => {
                        state.candles = cached;
                        state.isLoading = false;
                        // 캐시된 데이터를 사용 중이므로 에러는 표시하지 않음
                        state.error = null;
                    });
                } else {
                    // 캐시도 없으면 에러 표시하지 않음 - WebSocket으로 실시간 데이터 수신
                    set((state) => {
                        state.error = null; // 에러 표시하지 않음
                        state.isLoading = false;
                    });
                }
                // 에러를 다시 throw하지 않아서 UI가 계속 표시됨
            }
        },

        fetchOrderbook: async (ticker: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            // 프론트엔드 캐시에서 먼저 조회 (즉시 표시)
            const cached = getCache<OrderbookResponse>(CACHE_KEYS.STOCK_ORDERBOOK(ticker));
            if (cached) {
                set((state) => {
                    state.orderbook = cached;
                });
            }

            try {
                const response = await stockApi.getOrderbook(ticker);
                // 성공 시 캐시 업데이트 및 상태 업데이트 (호가는 실시간성이 중요하므로 짧은 TTL)
                setCache(CACHE_KEYS.STOCK_ORDERBOOK(ticker), response, 30 * 1000); // 30초
                set((state) => {
                    state.orderbook = response;
                    state.isLoading = false;
                    state.error = null;
                });
            } catch (error: any) {
                // 에러를 조용히 처리 (호가는 실시간성이 중요하므로 실패해도 UI에 표시하지 않음)
                // 개발 환경에서만 상세 로그 출력
                if (process.env.NODE_ENV === 'development') {
                    const errorMessage = error.response?.data?.message
                        || error.message
                        || (error.code === 'ERR_NETWORK' ? '네트워크 연결을 확인해주세요' : '호가 데이터를 불러오는데 실패했습니다');
                    console.warn('[fetchOrderbook] 호가 데이터 로드 실패 (조용히 처리):', {
                        ticker,
                        error: errorMessage,
                        code: error.code,
                        status: error.response?.status,
                    });
                }

                // 캐시된 데이터가 있으면 에러를 표시하지 않고 캐시 사용
                const cached = getCache<OrderbookResponse>(CACHE_KEYS.STOCK_ORDERBOOK(ticker));
                if (cached) {
                    set((state) => {
                        state.orderbook = cached;
                        state.isLoading = false;
                        // 캐시된 데이터를 사용 중이므로 에러는 표시하지 않음
                        state.error = null;
                    });
                } else {
                    // 캐시도 없으면 에러 표시하지 않음 - WebSocket으로 실시간 데이터 수신
                    set((state) => {
                        state.error = null; // 에러 표시하지 않음
                        state.isLoading = false;
                    });
                }
                // 에러를 다시 throw하지 않아서 UI가 계속 표시됨
            }
        },

        loadWatchlist: async () => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });
            try {
                const response = await userApi.getWatchlist();
                set((state) => {
                    state.watchlist = response.items.map(item => item.ticker);
                    state.isLoading = false;
                });
            } catch (error: any) {
                set((state) => {
                    state.error = error.response?.data?.message || 'Failed to load watchlist';
                    state.isLoading = false;
                });
                throw error;
            }
        },

        addToWatchlist: async (ticker: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });
            try {
                const response = await userApi.addWatchlist(ticker);
                set((state) => {
                    state.watchlist = response.items.map(item => item.ticker);
                    state.isLoading = false;
                });
            } catch (error: any) {
                set((state) => {
                    state.error = error.response?.data?.message || 'Failed to add to watchlist';
                    state.isLoading = false;
                });
                throw error;
            }
        },

        removeFromWatchlist: async (ticker: string) => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });
            try {
                const response = await userApi.removeWatchlist(ticker);
                set((state) => {
                    state.watchlist = response.items.map(item => item.ticker);
                    state.isLoading = false;
                });
            } catch (error: any) {
                set((state) => {
                    state.error = error.response?.data?.message || 'Failed to remove from watchlist';
                    state.isLoading = false;
                });
                throw error;
            }
        },
    }))
);
