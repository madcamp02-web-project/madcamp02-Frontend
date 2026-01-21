"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { usePortfolioStore } from '@/stores/portfolio-store';

export default function RecentTrades() {
    const { transactions, fetchHistory } = usePortfolioStore();

    React.useEffect(() => {
        fetchHistory().catch(() => { });
    }, [fetchHistory]);

    // Java LocalDateTime 배열 형식 변환: [년, 월, 일, 시, 분, 초, 나노초]
    const parseTradeDate = (tradeDate: unknown): Date | null => {
        if (!tradeDate) return null;
        if (Array.isArray(tradeDate) && tradeDate.length >= 6) {
            return new Date(
                tradeDate[0], // year
                tradeDate[1] - 1, // month (0-indexed)
                tradeDate[2], // day
                tradeDate[3], // hour
                tradeDate[4], // minute
                tradeDate[5], // second
                Math.floor((tradeDate[6] || 0) / 1000000) // milliseconds
            );
        }
        // 문자열인 경우 그대로 파싱
        const date = new Date(tradeDate as string);
        return isNaN(date.getTime()) ? null : date;
    };

    // Sort by tradeDate descending
    const sortedTrades = [...transactions]
        .sort((a, b) => {
            const dateA = parseTradeDate(a.tradeDate);
            const dateB = parseTradeDate(b.tradeDate);
            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        })
        .slice(0, 10);

    const formatTime = (tradeDate: unknown) => {
        const date = parseTradeDate(tradeDate);
        if (!date) return '-';
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
                        <div key={trade.logId} className="flex justify-between items-center p-2 border-b border-border last:border-0 hover:bg-secondary rounded transition-colors shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {trade.type === 'BUY' ? '↗' : '↘'}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-foreground">{trade.ticker}</div>
                                    <div className="text-xs text-muted-foreground">{formatTime(trade.tradeDate)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-bold ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.type === 'BUY' ? '매수' : '매도'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {trade.quantity ?? 0}주 @ ${(trade.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetCard>
    );
}
