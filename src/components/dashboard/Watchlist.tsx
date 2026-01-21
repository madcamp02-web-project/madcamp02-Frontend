"use client";

import React, { useEffect } from 'react';
import WidgetCard from './WidgetCard';
import { useStockStore } from '@/stores/stock-store';

export default function Watchlist() {
    const { watchlist, prices, loadWatchlist, setSelectedTicker } = useStockStore();

    useEffect(() => {
        loadWatchlist().catch(() => { });
    }, [loadWatchlist]);

    const stocks = watchlist.map(ticker => {
        const price = prices[ticker];
        const changePercent = price?.changePercent || 0;
        const priceValue = price?.price;
        return {
            t: ticker,
            n: ticker, // API에서 이름을 제공하면 추가
            p: priceValue !== undefined ? `$${priceValue.toFixed(2)}` : '$0.00',
            c: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            up: changePercent >= 0,
        };
    });

    return (
        <WidgetCard title="관심 종목" action={<span className="text-yellow-500">★</span>} className="h-full">
            <div className="flex flex-col gap-3">
                {stocks.map((stock) => (
                    <div key={stock.t} onClick={() => setSelectedTicker(stock.t)} className="flex justify-between items-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer border border-transparent hover:border-border group transition-all">
                        <div className="flex items-center gap-3">
                            {/* Arrow Icon Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${stock.up ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {stock.up ? '↗' : '↘'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-foreground text-sm">{stock.t}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{stock.n}</span>
                                </div>
                                <div className={`text-xs font-semibold ${stock.up ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.c}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-foreground text-sm">{stock.p}</div>
                        </div>
                    </div>
                ))}
                {/* View All Button */}
                <button className="w-full py-3 mt-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    전체 보기
                </button>
            </div>
        </WidgetCard>
    );
}
