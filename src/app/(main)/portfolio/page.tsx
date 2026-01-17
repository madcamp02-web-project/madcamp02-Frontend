"use client";

import React, { useState } from 'react';

// Mock Data
const portfolioStats = {
    totalAsset: 34250000,
    totalChange: "+666,348원 (+2.27%)",
    investedAmount: 24150000,
    investedNote: "보유 4종목",
    evaluationAmount: 24250000,
    evaluationNote: "현금 10,000,000원",
    profitLoss: 100000,
    profitLossPercent: "+0.41%",
};

const holdings = [
    { code: "005930", name: "삼성전자", quantity: 100, avgPrice: 70000, currentPrice: 71500, evalAmount: 7150000, profitLoss: 150000, profitPercent: "+2.14%" },
    { code: "000660", name: "SK하이닉스", quantity: 50, avgPrice: 135000, currentPrice: 132000, evalAmount: 6600000, profitLoss: -150000, profitPercent: "-2.22%" },
    { code: "035420", name: "NAVER", quantity: 30, avgPrice: 180000, currentPrice: 185000, evalAmount: 5550000, profitLoss: 150000, profitPercent: "+2.78%" },
];

const pieChartData = [
    { name: "삼성전자", value: 37, color: "#22C55E" },
    { name: "SK하이닉스", value: 34, color: "#3B82F6" },
    { name: "NAVER", value: 29, color: "#FACC15" },
];

const tradeHistory = [
    { date: "2024-01-15", time: "14:30:22", name: "삼성전자", type: "buy", quantity: 10, price: 71000, total: 710000 },
    { date: "2024-01-14", time: "10:15:08", name: "SK하이닉스", type: "sell", quantity: 5, price: 133000, total: 665000 },
    { date: "2024-01-12", time: "09:30:45", name: "NAVER", type: "buy", quantity: 10, price: 182000, total: 1820000 },
    { date: "2024-01-10", time: "15:22:11", name: "삼성전자", type: "buy", quantity: 20, price: 70500, total: 1410000 },
    { date: "2024-01-08", time: "11:45:33", name: "SK하이닉스", type: "buy", quantity: 15, price: 131000, total: 1965000 },
];

export default function PortfolioPage() {
    const [chartPeriod, setChartPeriod] = useState<'1w' | '1m' | '3m' | '1y'>('1m');
    const [selectedCard, setSelectedCard] = useState<'total' | 'invested' | 'evaluation' | 'profit'>('total');
    const [tableTab, setTableTab] = useState<'holdings' | 'history'>('holdings');

    const statsCards = [
        {
            key: 'total' as const,
            title: '총 자산',
            icon: '$',
            iconBg: 'bg-green-500',
            iconText: 'text-black',
            value: portfolioStats.totalAsset.toLocaleString() + '원',
            subValue: '↗ ' + portfolioStats.totalChange,
            subValueColor: 'text-green-400',
        },
        {
            key: 'invested' as const,
            title: '투자 금액',
            icon: '💰',
            iconBg: 'bg-gray-600',
            iconText: 'text-white',
            value: portfolioStats.investedAmount.toLocaleString() + '원',
            subValue: portfolioStats.investedNote,
            subValueColor: 'text-gray-500',
        },
        {
            key: 'evaluation' as const,
            title: '평가 금액',
            icon: '📊',
            iconBg: 'bg-gray-600',
            iconText: 'text-white',
            value: portfolioStats.evaluationAmount.toLocaleString() + '원',
            subValue: portfolioStats.evaluationNote,
            subValueColor: 'text-gray-500',
        },
        {
            key: 'profit' as const,
            title: '평가 손익',
            icon: '📈',
            iconBg: 'bg-purple-500/20',
            iconText: 'text-purple-400',
            value: '+' + portfolioStats.profitLoss.toLocaleString() + '원',
            valueColor: 'text-green-400',
            subValue: portfolioStats.profitLossPercent,
            subValueColor: 'text-green-400',
        },
    ];

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-white/5 shrink-0">
                <h1 className="text-2xl font-bold text-white">포트폴리오</h1>
                <p className="text-gray-500 text-sm">내 투자 현황 및 수익 분석</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {statsCards.map((card) => (
                        <div
                            key={card.key}
                            onClick={() => setSelectedCard(card.key)}
                            className={`bg-[#0F0F12] rounded-2xl p-4 cursor-pointer transition-all duration-200 ${selectedCard === card.key
                                ? 'border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'border border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 ${card.iconBg} rounded-full flex items-center justify-center`}>
                                    <span className={`${card.iconText} font-bold text-sm`}>{card.icon}</span>
                                </div>
                                <span className="text-gray-400 text-sm">{card.title}</span>
                            </div>
                            <div className={`text-2xl font-bold mb-1 ${card.valueColor || 'text-white'}`}>
                                {card.value}
                            </div>
                            <div className={`text-sm ${card.subValueColor}`}>
                                {card.subValue}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Asset Chart Section */}
                <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white font-bold text-lg">자산 추이</h2>
                        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                            {[
                                { key: '1w', label: '1주' },
                                { key: '1m', label: '1개월' },
                                { key: '3m', label: '3개월' },
                                { key: '1y', label: '1년' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setChartPeriod(tab.key as typeof chartPeriod)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartPeriod === tab.key
                                        ? 'bg-green-500 text-black'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Chart Area */}
                    <div className="h-[200px] bg-gradient-to-b from-green-500/10 to-transparent rounded-lg relative">
                        <div className="absolute inset-0 flex items-end px-4 pb-4">
                            {/* Simple bar chart visualization */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-green-500/40 mx-0.5 rounded-t"
                                    style={{ height: `${30 + Math.random() * 60}%` }}
                                />
                            ))}
                        </div>
                        {/* Y-axis labels */}
                        <div className="absolute left-2 top-2 text-gray-500 text-xs">32000000</div>
                        <div className="absolute left-2 top-1/3 text-gray-500 text-xs">24000000</div>
                        <div className="absolute left-2 top-2/3 text-gray-500 text-xs">16000000</div>
                        <div className="absolute left-2 bottom-2 text-gray-500 text-xs">8000000</div>
                    </div>
                </div>

                {/* Holdings Table & Pie Chart */}
                <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                    {/* Holdings Table / Trade History */}
                    <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => setTableTab('holdings')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tableTab === 'holdings' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                보유 종목
                            </button>
                            <button
                                onClick={() => setTableTab('history')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tableTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                거래 내역
                            </button>
                        </div>

                        {tableTab === 'holdings' ? (
                            <>
                                {/* Holdings Table Header */}
                                <div className="grid grid-cols-7 gap-2 text-gray-500 text-xs pb-2 border-b border-white/5">
                                    <div>종목명</div>
                                    <div className="text-right">보유수량</div>
                                    <div className="text-right">평균단가</div>
                                    <div className="text-right">현재가</div>
                                    <div className="text-right">평가금액</div>
                                    <div className="text-right">평가손익</div>
                                    <div className="text-right">수익률</div>
                                </div>
                                {/* Holdings Table Body */}
                                <div className="space-y-1">
                                    {holdings.map((stock) => (
                                        <div key={stock.code} className="grid grid-cols-7 gap-2 py-3 border-b border-white/5 text-sm">
                                            <div>
                                                <div className="text-white font-medium">{stock.name}</div>
                                                <div className="text-gray-500 text-xs">{stock.code}</div>
                                            </div>
                                            <div className="text-white text-right">{stock.quantity}</div>
                                            <div className="text-white text-right">{stock.avgPrice.toLocaleString()}</div>
                                            <div className="text-white text-right">{stock.currentPrice.toLocaleString()}</div>
                                            <div className="text-white text-right font-medium">{stock.evalAmount.toLocaleString()}</div>
                                            <div className={`text-right font-medium ${stock.profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                {stock.profitLoss >= 0 ? '+' : ''}{stock.profitLoss.toLocaleString()}
                                            </div>
                                            <div className={`text-right font-medium ${stock.profitPercent.startsWith('+') ? 'text-red-500' : 'text-blue-500'}`}>
                                                {stock.profitPercent}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Trade History Table Header */}
                                <div className="grid grid-cols-6 gap-2 text-gray-500 text-xs pb-2 border-b border-white/5">
                                    <div>일시</div>
                                    <div>종목명</div>
                                    <div className="text-center">구분</div>
                                    <div className="text-right">수량</div>
                                    <div className="text-right">체결가</div>
                                    <div className="text-right">거래금액</div>
                                </div>
                                {/* Trade History Table Body */}
                                <div className="space-y-1">
                                    {tradeHistory.map((trade, idx) => (
                                        <div key={idx} className="grid grid-cols-6 gap-2 py-3 border-b border-white/5 text-sm">
                                            <div>
                                                <div className="text-white">{trade.date}</div>
                                                <div className="text-gray-500 text-xs">{trade.time}</div>
                                            </div>
                                            <div className="text-white font-medium">{trade.name}</div>
                                            <div className="text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.type === 'buy' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {trade.type === 'buy' ? '매수' : '매도'}
                                                </span>
                                            </div>
                                            <div className="text-white text-right">{trade.quantity}</div>
                                            <div className="text-white text-right">{trade.price.toLocaleString()}</div>
                                            <div className="text-white text-right font-medium">{trade.total.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4">
                        <h3 className="text-white font-bold mb-4">포트폴리오 비중</h3>

                        {/* Donut Chart */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-40 h-40">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    {/* Background circle */}
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1f1f24" strokeWidth="20" />
                                    {/* Green segment (Samsung) */}
                                    <circle
                                        cx="50" cy="50" r="40" fill="none"
                                        stroke="#22C55E"
                                        strokeWidth="20"
                                        strokeDasharray={`${37 * 2.51} ${100 * 2.51}`}
                                        strokeDashoffset="0"
                                    />
                                    {/* Blue segment (SK) */}
                                    <circle
                                        cx="50" cy="50" r="40" fill="none"
                                        stroke="#3B82F6"
                                        strokeWidth="20"
                                        strokeDasharray={`${34 * 2.51} ${100 * 2.51}`}
                                        strokeDashoffset={`${-37 * 2.51}`}
                                    />
                                    {/* Yellow segment (NAVER) */}
                                    <circle
                                        cx="50" cy="50" r="40" fill="none"
                                        stroke="#FACC15"
                                        strokeWidth="20"
                                        strokeDasharray={`${29 * 2.51} ${100 * 2.51}`}
                                        strokeDashoffset={`${-(37 + 34) * 2.51}`}
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2">
                            {pieChartData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-400 text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-white font-medium text-sm">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
