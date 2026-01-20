"use client";

import { useEffect } from 'react';
import { socketClient } from '@/lib/api/socket-client';
import { useStockStore } from '@/stores/stock-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { StockPrice } from '@/types/stock';

export function useWebSocket() {
    const { updatePrice, updateIndices } = useStockStore();
    const { fetchPortfolio } = usePortfolioStore();

    useEffect(() => {
        // Connect on mount
        socketClient.connect();

        // Cleanup on unmount
        return () => {
            socketClient.disconnect();
        };
    }, []);

    // 지수 업데이트 구독
    useEffect(() => {
        let subscription: any = null;

        const setupSubscription = async () => {
            // 연결이 안 되어 있으면 연결 시도
            if (!socketClient.isConnected()) {
                await socketClient.connect().catch((error) => {
                    console.error('[STOMP] Connection failed:', error);
                    return;
                });
            }

            subscription = await socketClient.subscribe('/topic/stock.indices', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    updateIndices(data);
                } catch (error) {
                    console.error('Failed to parse indices update:', error);
                }
            });
        };

        setupSubscription();

        return () => {
            if (subscription) {
                socketClient.unsubscribe('/topic/stock.indices');
            }
        };
    }, [updateIndices]);

    // 거래 알림 구독
    useEffect(() => {
        let subscription: any = null;

        const setupSubscription = async () => {
            // 연결이 안 되어 있으면 연결 시도
            if (!socketClient.isConnected()) {
                await socketClient.connect().catch((error) => {
                    console.error('[STOMP] Connection failed:', error);
                    return;
                });
            }

            subscription = await socketClient.subscribe('/user/queue/trade', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    // 포트폴리오 재조회
                    fetchPortfolio().catch(() => {});
                    // 필요 시 토스트 알림 표시
                } catch (error) {
                    console.error('Failed to parse trade notification:', error);
                }
            });
        };

        setupSubscription();

        return () => {
            if (subscription) {
                socketClient.unsubscribe('/user/queue/trade');
            }
        };
    }, [fetchPortfolio]);

    return socketClient;
}
