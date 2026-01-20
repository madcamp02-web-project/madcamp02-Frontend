export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: ErrorResponse;
}

export interface ErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
}

export enum ErrorCode {
    AUTH_EXPIRED_TOKEN = 'AUTH_001',
    AUTH_INVALID_TOKEN = 'AUTH_002',
    AUTH_ACCESS_DENIED = 'AUTH_003',
    TRADE_INSUFFICIENT_BALANCE = 'TRADE_001',
    TRADE_INSUFFICIENT_QUANTITY = 'TRADE_002',
    TRADE_INVALID_TIME = 'TRADE_003',
    TRADE_INVALID_STOCK = 'TRADE_004',
    GAME_INSUFFICIENT_COIN = 'GAME_001',
    GAME_GACHA_FAILED = 'GAME_002',
    GAME_ITEM_NOT_FOUND = 'GAME_003',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

// Market API Response Types
export interface MarketIndexItem {
    code: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
    currency: string;
}

export interface MarketIndicesResponse {
    asOf: string;
    items: MarketIndexItem[];
}

export interface MarketNewsItem {
    id: string;
    headline: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
}

export interface MarketNewsResponse {
    asOf: string;
    items: MarketNewsItem[];
}

export interface MarketMoverItem {
    ticker: string;
    name: string;
    price: number;
    changePercent: number;
    volume: number;
    direction: 'UP' | 'DOWN';
}

export interface MarketMoversResponse {
    asOf: string;
    items: MarketMoverItem[];
}

// Trade API Response Types
export interface TradeOrderRequest {
    ticker: string;
    type: 'BUY' | 'SELL';
    quantity: number;
}

export interface AvailableBalanceResponse {
    availableBalance: number;
    cashBalance: number;
    currency: string;
}

export interface TradeResponse {
    orderId: number;
    ticker: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    executedPrice: number;
    totalAmount: number;
    executedAt: string;
}

export interface TradeHistoryItem {
    logId: number;
    ticker: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    realizedPnl: number | null;
    tradeDate: string;
}

export interface TradeHistoryResponse {
    asOf: string;
    items: TradeHistoryItem[];
}

export interface PortfolioPosition {
    ticker: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    pnl: number;
    pnlPercent: number;
}

export interface PortfolioSummary {
    totalEquity: number;
    cashBalance: number;
    totalPnl: number;
    totalPnlPercent: number;
    currency: string;
}

export interface PortfolioResponse {
    asOf: string;
    summary: PortfolioSummary;
    positions: PortfolioPosition[];
}

// Game API Response Types
export interface GameItem {
    itemId: number;
    name: string;
    category: 'NAMEPLATE' | 'AVATAR' | 'THEME';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    probability?: number;
    imageUrl?: string;
    description?: string;
}

export interface ItemsResponse {
    asOf?: string;
    items: GameItem[];
}

export interface GachaResponse {
    itemId: number;
    name: string;
    category: 'NAMEPLATE' | 'AVATAR' | 'THEME';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    imageUrl?: string;
    remainingCoin: number;
}

export interface InventoryItem {
    itemId: number;
    name: string;
    category: 'NAMEPLATE' | 'AVATAR' | 'THEME';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    imageUrl?: string;
    equipped: boolean;
}

export interface InventoryResponse {
    items: InventoryItem[];
}

export interface RankingItem {
    rank: number;
    userId: number;
    nickname: string;
    avatarUrl?: string;
    totalEquity: number;
    returnPercent: number;
}

export interface RankingMy {
    rank: number;
    totalEquity: number;
    returnPercent: number;
}

export interface RankingResponse {
    asOf: string;
    items: RankingItem[];
    my?: RankingMy;
}

// User API Response Types
export interface WatchlistItem {
    ticker: string;
    addedAt: string;
}

export interface UserWatchlistResponse {
    items: WatchlistItem[];
}

// Stock API Response Types
export interface StockSearchItem {
    symbol: string;
    name: string;
    exchange?: string;
    type?: string;
}

export interface StockSearchResponse {
    items: StockSearchItem[];
}

export interface StockQuote {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    previousClose?: number;
}

export interface StockQuoteResponse extends StockQuote {}

export interface OrderbookItem {
    price: number;
    quantity: number;
}

export interface OrderbookResponse {
    ticker: string;
    asks: OrderbookItem[];
    bids: OrderbookItem[];
    timestamp: string;
}

export interface CandleItem {
    timestamp: number; // Unix timestamp (초 단위)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface CandlesResponse {
    ticker: string;
    resolution: string; // 백엔드 period 값: "d" (daily), "w" (weekly), "m" (monthly)
    items: CandleItem[];
    stale?: boolean; // 만료된 데이터인지 여부
    warning?: string; // 경고 메시지 (선택적, 하위 호환성)
}
