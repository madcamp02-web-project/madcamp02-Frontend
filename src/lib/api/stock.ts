import { api } from './index';

export const stockApi = {
    // Market Indices
    getIndices: async () => {
        const { data } = await api.get('/api/v1/market/indices');
        return data; // { items: [...] }
    },

    // Market News
    getNews: async () => {
        const { data } = await api.get('/api/v1/market/news');
        return data; // { items: [...] }
    },

    // Market Movers
    getMovers: async () => {
        const { data } = await api.get('/api/v1/market/movers');
        return data; // { items: [...] }
    },

    // Search Stocks
    search: async (query: string) => {
        const { data } = await api.get(`/api/v1/stock/search?q=${query}`);
        return data; // { items: [...] }
    },

    // Get Candles
    getCandles: async (ticker: string, timeframe: string) => {
        const { data } = await api.get(`/api/v1/stock/candles/${ticker}?timeframe=${timeframe}`);
        return data; // { items: [...] }
    },

    // Get Orderbook (Snapshot)
    getOrderbook: async (ticker: string) => {
        const { data } = await api.get(`/api/v1/stock/orderbook/${ticker}`);
        return data;
    },

    // Place Order
    placeOrder: async (orderData: any) => {
        const { data } = await api.post('/api/v1/trade/order', orderData);
        return data;
    },

    // Get Portfolio
    getPortfolio: async () => {
        const { data } = await api.get('/api/v1/trade/portfolio');
        return data; // { items: [...] }
    },

    // Get Trade History
    getHistory: async () => {
        const { data } = await api.get('/api/v1/trade/history');
        return data; // { items: [...] }
    }
};
