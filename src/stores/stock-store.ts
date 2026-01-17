import { create } from 'zustand';
import { StockPrice } from '@/types/stock';
import { immer } from 'zustand/middleware/immer';

interface StockState {
    prices: Record<string, StockPrice>; // ticker -> price
    watchlist: string[];

    updatePrice: (price: StockPrice) => void;
    setWatchlist: (tickers: string[]) => void;
}

export const useStockStore = create<StockState>()(
    immer((set) => ({
        prices: {},
        watchlist: [],

        updatePrice: (price) =>
            set((state) => {
                state.prices[price.ticker] = price;
            }),

        setWatchlist: (tickers) =>
            set((state) => {
                state.watchlist = tickers;
            }),
    }))
);
