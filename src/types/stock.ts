export interface StockPrice {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    open?: number;
    high?: number;
    low?: number;
    timestamp: number;
}

export interface StockCandle {
    time: number; // unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface PortfolioItem {
    ticker: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    profit: number;
    profitPercent: number;
}
