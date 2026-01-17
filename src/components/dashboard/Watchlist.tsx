"use client";

import React from 'react';
import WidgetCard from './WidgetCard';

export default function Watchlist() {
    const stocks = [
        { t: 'AAPL', n: 'Apple', p: '$167.20', c: '+3.15%', up: true },
        { t: 'TSLA', n: 'Tesla', p: '$242.80', c: '-1.30%', up: false },
        { t: 'NVDA', n: 'NVIDIA', p: '$485.30', c: '+2.65%', up: true },
        { t: 'MSFT', n: 'Microsoft', p: '$378.90', c: '+0.61%', up: true }
    ];

    return (
        <WidgetCard title="관심 종목" action={<span className="text-yellow-500">★</span>} className="h-full">
            <div className="flex flex-col gap-3">
                {stocks.map((stock) => (
                    <div key={stock.t} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-transparent hover:border-white/10 group transition-all">
                        <div className="flex items-center gap-3">
                            {/* Arrow Icon Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${stock.up ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {stock.up ? '↗' : '↘'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-white text-sm">{stock.t}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">{stock.n}</span>
                                </div>
                                <div className={`text-xs font-semibold ${stock.up ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.c}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-white text-sm">{stock.p}</div>
                        </div>
                    </div>
                ))}
                {/* View All Button */}
                <button className="w-full py-3 mt-2 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                    전체 보기
                </button>
            </div>
        </WidgetCard>
    );
}
