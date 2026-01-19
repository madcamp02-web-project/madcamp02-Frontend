"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useStockStore } from '@/stores/stock-store';

export default function PortfolioSummary() {
    const { cash, holdings } = usePortfolioStore();
    const { prices } = useStockStore();

    const EXCHANGE_RATE = 1430;

    // Calculate Total Assets
    let totalStockValueUSD = 0;
    const initialInvestedUSD = 10000; // Fixed initial

    const holdingList = Object.values(holdings).map(h => {
        // Fallback prices
        const fallbackPrices: Record<string, number> = {
            '005930': 71500,
            '000660': 132000,
            '035420': 185000,
            '005380': 198000,
            '051910': 420000,
            'AAPL': 167.20,
            'TSLA': 245.80,
            'NVDA': 460.10,
            'MSFT': 330.40,
            'GOOGL': 135.50,
            'AMZN': 140.20
        };

        const currentPriceRaw = prices[h.ticker]?.price || fallbackPrices[h.ticker] || h.avgPrice;

        // Check currency (Simple logic: if number is huge, it's KRW)
        // Or better, use the known KRW list same as OrderPanel
        const isKRW = ['005930', '000660', '035420', '005380', '051910'].includes(h.ticker);

        // Normalize to USD
        const currentPriceUSD = isKRW ? currentPriceRaw / EXCHANGE_RATE : currentPriceRaw;
        const avgPriceUSD = isKRW ? h.avgPrice / EXCHANGE_RATE : h.avgPrice; // h.avgPrice in store is raw local currency

        const currentValueUSD = currentPriceUSD * h.quantity;
        totalStockValueUSD += currentValueUSD;

        const gainLossUSD = currentValueUSD - (avgPriceUSD * h.quantity);
        const gainLossPercent = ((currentPriceUSD - avgPriceUSD) / avgPriceUSD) * 100;

        return {
            s: h.ticker,
            n: h.ticker,
            q: `${h.quantity}주`,
            avg: `$${avgPriceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            p: `$${currentValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            y: `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`,
            isGain: gainLossPercent >= 0
        };
    });

    const totalAssetUSD = cash + totalStockValueUSD;
    const totalGainUSD = totalAssetUSD - initialInvestedUSD;
    const totalGainPercent = (totalGainUSD / initialInvestedUSD) * 100;

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
