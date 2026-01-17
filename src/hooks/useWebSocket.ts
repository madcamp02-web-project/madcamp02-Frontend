"use client";

import { useEffect } from 'react';
import { socketClient } from '@/lib/api/socket-client';
import { useStockStore } from '@/stores/stock-store';
import { StockPrice } from '@/types/stock';

export function useWebSocket() {
    const updatePrice = useStockStore((state) => state.updatePrice);

    useEffect(() => {
        // Connect on mount
        socketClient.connect();

        // Cleanup on unmount
        return () => {
            socketClient.disconnect();
        };
    }, []);

    // Example subscription (could be expanded)
    useEffect(() => {
        // Wait for connection to be active? 
        // STOMP client handles queueing subscriptions usually if configured, 
        // but here we might need to wait for onConnect. 
        // For now, let's assuming simple topic subscription if connected.

        // This is a placeholder for where we would subscribe to topics
        // e.g. socketClient.subscribe('/topic/stocks', (msg) => { ... })

        // Setup listener logic here if needed
    }, [updatePrice]);

    return socketClient;
}
