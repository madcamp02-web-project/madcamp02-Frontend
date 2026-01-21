import { create } from 'zustand';
import { tradeApi } from '@/lib/api/trade';
import { PortfolioResponse, PortfolioPosition, TradeHistoryItem, AvailableBalanceResponse, TradeOrderRequest } from '@/types/api';

interface PortfolioState {
    // Portfolio summary
    summary: PortfolioResponse['summary'] | null;
    // Positions (holdings)
    positions: PortfolioPosition[];
    // Trade history
    transactions: TradeHistoryItem[];
    // Available balance
    availableBalance: number | null;
    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPortfolio: () => Promise<void>;
    fetchHistory: () => Promise<void>;
    fetchAvailableBalance: () => Promise<void>;
    placeOrder: (orderData: TradeOrderRequest) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    summary: null,
    positions: [],
    transactions: [],
    availableBalance: null,
    isLoading: false,
    error: null,

    fetchPortfolio: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await tradeApi.getPortfolio();
            set({
                summary: response.summary,
                positions: response.positions,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch portfolio',
                isLoading: false
            });
            throw error;
        }
    },

    fetchHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await tradeApi.getHistory();
            console.log('Trade History Response:', response);
            console.log('First item:', response.items?.[0]);
            set({
                transactions: response.items,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch trade history',
                isLoading: false
            });
            throw error;
        }
    },

    fetchAvailableBalance: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await tradeApi.getAvailableBalance();
            set({
                availableBalance: response.availableBalance,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch available balance',
                isLoading: false
            });
            throw error;
        }
    },

    placeOrder: async (orderData: TradeOrderRequest) => {
        set({ isLoading: true, error: null });
        try {
            await tradeApi.placeOrder(orderData);
            // 주문 성공 후 포트폴리오와 잔고 재조회
            await Promise.all([
                get().fetchPortfolio(),
                get().fetchAvailableBalance(),
                get().fetchHistory(),
            ]);
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to place order',
                isLoading: false
            });
            throw error;
        }
    },
}));
