"use client";

import React from 'react';
import WidgetCard from './WidgetCard';

export default function RecentTrades() {
    return (
        <WidgetCard title="최근 거래" className="h-full">
            <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center p-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                {i % 2 === 0 ? '↘' : '↗'}
                            </div>
                            <div>
                                <div className="font-bold text-sm">{i % 2 === 0 ? 'SK하이닉스' : '삼성전자'}</div>
                                <div className="text-xs text-gray-500">14:2{i}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold ${i % 2 === 0 ? 'text-red-500' : 'text-green-500'}`}>{i % 2 === 0 ? '매도' : '매수'}</div>
                            <div className="text-xs text-gray-400">{i * 10}주 @ {i % 2 === 0 ? '133,000' : '71,000'}</div>
                        </div>
                    </div>
                ))}
            </div>
        </WidgetCard>
    );
}
