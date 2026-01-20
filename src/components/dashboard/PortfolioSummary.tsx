"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useStockStore } from '@/stores/stock-store';

export default function PortfolioSummary() {
    const { summary, positions, fetchPortfolio } = usePortfolioStore();

    React.useEffect(() => {
        fetchPortfolio().catch(() => {});
    }, [fetchPortfolio]);

    const holdingList = positions.map(pos => {
        const avgPrice = pos.avgPrice ?? 0;
        const marketValue = pos.marketValue ?? 0;
        const pnlPercent = pos.pnlPercent ?? 0;
        return {
            s: pos.ticker,
            n: pos.ticker, // API에서 이름을 제공하면 추가
            q: `${pos.quantity ?? 0}주`,
            avg: `$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            p: `$${marketValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            y: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`,
            isGain: pnlPercent >= 0
        };
    });

    const totalAssetUSD = summary?.totalEquity || 0;
    const totalGainUSD = summary?.totalPnl || 0;
    const totalGainPercent = summary?.totalPnlPercent || 0;
    const cash = summary?.cashBalance || 0;

    return (
        <WidgetCard title="내 포트폴리오" className="h-full">
            <div className="flex flex-col h-full gap-3">
                {/* Total Asset Card */}
                <div className="bg-secondary border border-border rounded-xl p-4">
                    <div className="text-muted-foreground text-sm mb-1">총 평가액 (Total Asset)</div>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold text-foreground tracking-tight">${totalAssetUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-right">
                            <div className={`text-lg font-bold drop-shadow-[0_0_8px_rgba(0,0,0,0.1)] ${totalGainUSD >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {totalGainUSD >= 0 ? '+' : ''}${Math.abs(totalGainUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-medium opacity-80 ${totalGainPercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                ({totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        예수금 (Cash): <span className="text-foreground font-mono">${cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Holdings List */}
                <div className="flex-1 flex flex-col gap-1 overflow-auto custom-scrollbar">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 px-1">보유 종목</h3>

                    {holdingList.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                            보유 자산이 없습니다.
                        </div>
                    ) : (
                        holdingList.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground">{item.s}</span>
                                        <span className="text-xs text-muted-foreground">{item.q}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">@{item.avg}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold text-sm ${item.isGain ? 'text-red-500' : 'text-blue-500'}`}>{item.y}</div>
                                    <div className="text-xs text-foreground opacity-80">{item.p}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </WidgetCard>
    );
}
