import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


export interface Holding {
    ticker: string;
    quantity: number;
    avgPrice: number;
}

export interface Transaction {
    id: string;
    ticker: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    timestamp: number; // Use timestamp for easier sorting
}

interface PortfolioState {
    cash: number; // In USD
    holdings: Record<string, Holding>; // key: ticker
    transactions: Transaction[];

    // Actions
    buyStock: (ticker: string, price: number, quantity: number, type?: 'buy' | 'sell') => void; // price is in TICKER'S CURRENCY
    sellStock: (ticker: string, price: number, quantity: number, type?: 'buy' | 'sell') => void;
    resetPortfolio: () => void;
}

const EXCHANGE_RATE = 1430; // 1 USD = 1430 KRW

export const usePortfolioStore = create<PortfolioState>()(
    persist(
        (set, get) => ({
            cash: 10000, // Initial $10,000 USD
            holdings: {},
            transactions: [],

            buyStock: (ticker, price, quantity) =>
                set((state) => {
                    const isKRW = ['005930', '000660', '035420', '005380', '051910'].includes(ticker);
                    const costInLocal = price * quantity;
                    const costInUSD = isKRW ? costInLocal / EXCHANGE_RATE : costInLocal;

                    if (state.cash < costInUSD) {
                        alert('not enough cash');
                        return state;
                    }

                    const newCash = state.cash - costInUSD;
                    // ... rest of logic needs to handle normalized avgPrice?
                    // Actually, let's keep holdings avgPrice in LOCAL currency for tracking per-stock performance correctly.
                    // We only convert CASH interactions.

                    const existing = state.holdings[ticker];
                    const newQuantity = (existing?.quantity || 0) + quantity;
                    const totalCost = (existing?.avgPrice || 0) * (existing?.quantity || 0) + price * quantity;
                    const newAvgPrice = totalCost / newQuantity;

                    return {
                        cash: newCash,
                        holdings: {
                            ...state.holdings,
                            [ticker]: {
                                ticker,
                                quantity: newQuantity,
                                avgPrice: newAvgPrice,
                            },
                        },
                        transactions: [
                            ...state.transactions,
                            {
                                id: Math.random().toString(36).substring(7),
                                ticker,
                                type: 'buy',
                                price, // Record local price
                                quantity,
                                timestamp: Date.now(),
                            },
                        ],
                    };
                }),

            sellStock: (ticker, price, quantity) =>
                set((state) => {
                    const existing = state.holdings[ticker];
                    if (!existing || existing.quantity < quantity) {
                        alert('not enough stock');
                        return state;
                    }

                    const isKRW = ['005930', '000660', '035420', '005380', '051910'].includes(ticker);
                    const revenueInLocal = price * quantity;
                    const revenueInUSD = isKRW ? revenueInLocal / EXCHANGE_RATE : revenueInLocal;

                    const newCash = state.cash + revenueInUSD;
                    const newQuantity = existing.quantity - quantity;

                    if (newQuantity === 0) {
                        const { [ticker]: _, ...rest } = state.holdings;
                        return {
                            cash: newCash,
                            holdings: rest,
                            transactions: [
                                ...state.transactions,
                                {
                                    id: Math.random().toString(36).substring(7),
                                    ticker,
                                    type: 'sell',
                                    price,
                                    quantity,
                                    timestamp: Date.now(),
                                },
                            ]
                        };
                    }

                    return {
                        cash: newCash,
                        holdings: {
                            ...state.holdings,
                            [ticker]: {
                                ...existing,
                                quantity: newQuantity,
                            },
                        },
                        transactions: [
                            ...state.transactions,
                            {
                                id: Math.random().toString(36).substring(7),
                                ticker,
                                type: 'sell',
                                price,
                                quantity,
                                timestamp: Date.now(),
                            },
                        ]
                    };
                }),

            resetPortfolio: () => set({ cash: 10000, holdings: {}, transactions: [] }),
        }),
        {
            name: 'portfolio-storage',
        }
    )
);
