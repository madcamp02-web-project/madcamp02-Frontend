import { api } from './index';
import {
    TradeOrderRequest,
    TradeResponse,
    AvailableBalanceResponse,
    PortfolioResponse,
    TradeHistoryResponse,
} from '@/types/api';

export const tradeApi = {
    // Get Available Balance
    getAvailableBalance: async (): Promise<AvailableBalanceResponse> => {
        const { data } = await api.get<AvailableBalanceResponse>('/api/v1/trade/available-balance');
        return data;
    },

    // Place Order
    placeOrder: async (orderData: TradeOrderRequest): Promise<TradeResponse> => {
        const { data } = await api.post<TradeResponse>('/api/v1/trade/order', orderData);
        return data;
    },

    // Get Portfolio
    getPortfolio: async (): Promise<PortfolioResponse> => {
        const { data } = await api.get<PortfolioResponse>('/api/v1/trade/portfolio');
        return data;
    },

    // Get Trade History
    getHistory: async (): Promise<TradeHistoryResponse> => {
        const { data } = await api.get<TradeHistoryResponse>('/api/v1/trade/history');
        return data;
    },
};
