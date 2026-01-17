"use client";

import React from 'react';
import WidgetCard from './WidgetCard';

export default function PortfolioSummary() {
    return (
        <WidgetCard title="내 포트폴리오" className="h-full">
            <div className="flex flex-col h-full gap-5">
                {/* Total Asset Card */}
                <div className="bg-[#1E1E24] border border-white/5 rounded-xl p-5">
                    <div className="text-gray-400 text-sm mb-1">총 평가액</div>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold text-white tracking-tight">$4,098.50</div>
                        <div className="text-right">
                            {/* Gold Highlight for Total Profit */}
                            <div className="text-[#FFD700] text-lg font-bold drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
                                +$498.50
                            </div>
                            <div className="text-[#FFD700] text-xs font-medium opacity-80">(+13.85%)</div>
                        </div>
                    </div>
                </div>

                {/* Holdings List */}
                <div className="flex-1 flex flex-col gap-2 overflow-auto">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Holding Assets</h3>

                    {[
                        { s: 'AAPL', n: 'Apple', q: '10주', avg: '$150.00', p: '$1672.00', y: '+11.47%' },
                        { s: 'NVDA', n: 'NVIDIA', q: '5주', avg: '$420.00', p: '$2426.50', y: '+15.55%' },
                        { s: 'TSLA', n: 'Tesla', q: '12주', avg: '$210.00', p: '$2913.60', y: '-3.20%', down: true }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{item.s}</span>
                                    <span className="text-xs text-gray-400">{item.q}</span>
                                </div>
                                <div className="text-xs text-gray-500">@{item.avg}</div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold text-sm ${item.down ? 'text-red-500' : 'text-green-500'}`}>{item.y}</div>
                                <div className="text-xs text-white opacity-80">{item.p}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </WidgetCard>
    );
}
