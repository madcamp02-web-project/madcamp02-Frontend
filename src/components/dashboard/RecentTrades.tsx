"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { usePortfolioStore } from '@/stores/portfolio-store';

export default function RecentTrades() {
    const { transactions } = usePortfolioStore();

    // Sort by timestamp descending
    const sortedTrades = [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <WidgetCard title="최근 거래" className="h-full">
            <div className="flex flex-col gap-1 overflow-y-auto h-full pr-1 custom-scrollbar">
                {sortedTrades.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        거래 내역이 없습니다.
                    </div>
                ) : (
                    sortedTrades.map((trade) => (
                        <div key={trade.id} className="flex justify-between items-center p-2 border-b border-border last:border-0 hover:bg-secondary rounded transition-colors shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${trade.type === 'buy' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {trade.type === 'buy' ? '↗' : '↘'}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-foreground">{trade.ticker}</div>
                                    <div className="text-xs text-muted-foreground">{formatTime(trade.timestamp)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-bold ${trade.type === 'buy' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {trade.type === 'buy' ? '매수' : '매도'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {trade.quantity}주 @ ${trade.price.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetCard>
    );
}
