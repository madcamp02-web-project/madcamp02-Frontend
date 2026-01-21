"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolio-store';


export default function PortfolioPage() {
    const [tableTab, setTableTab] = useState<'holdings' | 'history'>('holdings');

    const {
        summary,
        positions,
        transactions,
        isLoading,
        fetchPortfolio,
        fetchHistory
    } = usePortfolioStore();

    // 초기 로드
    useEffect(() => {
        fetchPortfolio().catch(() => { });
        fetchHistory().catch(() => { });
    }, [fetchPortfolio, fetchHistory]);

    // --- Derived Data ---
    const holdingsList = useMemo(() => {
        return positions.map(pos => {
            // API에서 받은 데이터 사용 (이미 USD 기준으로 계산됨)
            return {
                ticker: pos.ticker,
                name: pos.ticker, // API에서 이름을 제공하면 추가
                quantity: pos.quantity,
                avgPrice: pos.avgPrice,
                currentPrice: pos.currentPrice,
                marketValue: pos.marketValue,
                pnl: pos.pnl,
                pnlPercent: pos.pnlPercent,
            };
        });
    }, [positions]);

    // Summary에서 총계 정보 사용
    const totalInvested = holdingsList.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
    const totalEvaluation = summary?.totalEquity ? summary.totalEquity - (summary.cashBalance || 0) : holdingsList.reduce((sum, h) => sum + h.marketValue, 0);
    const totalAsset = summary?.totalEquity || 0;
    const totalProfitLoss = summary?.totalPnl || holdingsList.reduce((sum, h) => sum + h.pnl, 0);
    const totalProfitPercent = summary?.totalPnlPercent || (totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0);
    const cash = summary?.cashBalance || 0;

    const statsCards = [
        {
            key: 'total' as const,
            title: '총 자산 (USD)',
            icon: '$',
            iconBg: 'bg-green-500',
            iconText: 'text-black',
            value: '$' + totalAsset.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            subValue: '현금 $' + cash.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            subValueColor: 'text-muted-foreground',
        },
        {
            key: 'invested' as const,
            title: '투자 금액',
            icon: '💰',
            iconBg: 'bg-yellow-500/20',
            iconText: 'text-yellow-500',
            value: '$' + totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            subValue: `${holdingsList.length}종목 보유`,
            subValueColor: 'text-muted-foreground',
        },
        {
            key: 'evaluation' as const,
            title: '평가 금액',
            icon: '📊',
            iconBg: 'bg-blue-500/20',
            iconText: 'text-blue-500',
            value: '$' + totalEvaluation.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            subValue: '평가액',
            subValueColor: 'text-muted-foreground',
        },
        {
            key: 'profit' as const,
            title: '평가 손익',
            icon: '📈',
            iconBg: 'bg-purple-500/20',
            iconText: 'text-purple-400',
            value: (totalProfitLoss > 0 ? '+' : '') + '$' + Math.abs(totalProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            valueColor: totalProfitLoss >= 0 ? 'text-green-400' : 'text-blue-400',
            subValue: (totalProfitPercent > 0 ? '+' : '') + totalProfitPercent.toFixed(2) + '%',
            subValueColor: totalProfitPercent >= 0 ? 'text-green-400' : 'text-blue-400',
        },
    ];

    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
    );


    // Pie Chart Data - Use Normalized USD values
    const pieChartData = holdingsList.map(h => {
        // Generate a consistent color based on ticker
        const codeSum = h.ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = codeSum % 360;
        const color = `hsl(${hue}, 70%, 50%)`;

        return {
            name: h.name,
            value: totalEvaluation > 0 ? Math.round((h.marketValue / totalEvaluation) * 100) : 0,
            color
        };
    }).sort((a, b) => b.value - a.value);

    if (isLoading && !summary && positions.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-muted-foreground">데이터를 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col overflow-hidden" suppressHydrationWarning>
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
                <h1 className="text-2xl font-bold text-foreground">포트폴리오</h1>
                <p className="text-muted-foreground text-sm">내 투자 현황 및 수익 분석</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {statsCards.map((card) => (
                        <div
                            key={card.key}
                            className="bg-card rounded-2xl p-4 border border-border hover:border-muted-foreground/20 hover:bg-secondary/50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 ${card.iconBg} rounded-full flex items-center justify-center`}>
                                    <span className={`${card.iconText} font-bold text-sm`}>{card.icon}</span>
                                </div>
                                <span className="text-muted-foreground text-sm">{card.title}</span>
                            </div>
                            <div className={`text-2xl font-bold mb-1 ${card.valueColor || 'text-foreground'}`}>
                                {card.value}
                            </div>
                            <div className={`text-sm ${card.subValueColor}`}>
                                {card.subValue}
                            </div>
                        </div>
                    ))}
                </div>


                {/* Holdings Table & Pie Chart */}
                <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                    {/* Holdings Table / Trade History */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => setTableTab('holdings')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tableTab === 'holdings' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                보유 종목
                            </button>
                            <button
                                onClick={() => setTableTab('history')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tableTab === 'history' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                거래 내역
                            </button>
                        </div>

                        {tableTab === 'holdings' ? (
                            <>
                                {/* Holdings Table Header */}
                                <div className="grid grid-cols-7 gap-2 text-muted-foreground text-xs pb-2 border-b border-border">
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
                                    {holdingsList.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm">보유 중인 종목이 없습니다.</div>
                                    ) : (
                                        holdingsList.map((stock) => (
                                            <div key={stock.ticker} className="grid grid-cols-7 gap-2 py-3 border-b border-border text-sm">
                                                <div>
                                                    <div className="text-foreground font-medium">{stock.name}</div>
                                                    <div className="text-muted-foreground text-xs">{stock.ticker}</div>
                                                </div>
                                                <div className="text-foreground text-right">{stock.quantity}</div>
                                                <div className="text-foreground text-right">
                                                    ${(stock.avgPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-foreground text-right">
                                                    ${(stock.currentPrice ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-foreground text-right font-medium">
                                                    ${(stock.marketValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </div>
                                                <div className={`text-right font-medium ${(stock.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(stock.pnl ?? 0) >= 0 ? '+' : ''}${Math.abs(stock.pnl ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </div>
                                                <div className={`text-right font-medium ${(stock.pnlPercent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {(stock.pnlPercent ?? 0) >= 0 ? '+' : ''}{(stock.pnlPercent ?? 0).toFixed(2)}%
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Trade History Table Header */}
                                <div className="grid grid-cols-6 gap-2 text-muted-foreground text-xs pb-2 border-b border-border">
                                    <div>일시</div>
                                    <div>종목명</div>
                                    <div className="text-center">구분</div>
                                    <div className="text-right">수량</div>
                                    <div className="text-right">체결가</div>
                                    <div className="text-right">거래금액</div>
                                </div>
                                {/* Trade History Table Body */}
                                <div className="space-y-1">
                                    {sortedTransactions.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm">거래 내역이 없습니다.</div>
                                    ) : (
                                        sortedTransactions.map((trade) => (
                                            <div key={trade.logId} className="grid grid-cols-6 gap-2 py-3 border-b border-border text-sm">
                                                <div>
                                                    {(() => {
                                                        // Java LocalDateTime 배열 형식 변환: [년, 월, 일, 시, 분, 초, 나노초]
                                                        const parseTradeDate = (tradeDate: any): Date | null => {
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
                                                            const date = new Date(tradeDate);
                                                            return isNaN(date.getTime()) ? null : date;
                                                        };
                                                        const date = parseTradeDate(trade.tradeDate);
                                                        return (
                                                            <>
                                                                <div className="text-foreground">
                                                                    {date ? date.toLocaleDateString() : '-'}
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    {date ? date.toLocaleTimeString() : '-'}
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="text-foreground font-medium">{trade.ticker}</div>
                                                <div className="text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                        {trade.type === 'BUY' ? '매수' : '매도'}
                                                    </span>
                                                </div>
                                                <div className="text-foreground text-right">{trade.quantity ?? 0}</div>
                                                <div className="text-foreground text-right">${(trade.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                <div className="text-foreground text-right font-medium">${(trade.totalAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <h3 className="text-foreground font-bold mb-4">포트폴리오 비중</h3>

                        {/* Donut Chart */}
                        <div className="flex items-center justify-center mb-4">
                            {pieChartData.length > 0 ? (
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        {/* Background circle */}
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="20" />
                                        {pieChartData.map((item, index) => {
                                            const dashArray = `${item.value * 2.51} ${100 * 2.51}`;
                                            // Calculate offset based on previous items
                                            const prevSum = pieChartData.slice(0, index).reduce((acc, curr) => acc + curr.value, 0);
                                            const dashOffset = -prevSum * 2.51;

                                            return (
                                                <circle
                                                    key={item.name}
                                                    cx="50" cy="50" r="40" fill="none"
                                                    stroke={item.color}
                                                    strokeWidth="20"
                                                    strokeDasharray={dashArray}
                                                    strokeDashoffset={dashOffset}
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-full border-4 border-muted flex items-center justify-center text-muted-foreground text-xs">
                                    보유 없음
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="space-y-2">
                            {pieChartData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-muted-foreground text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-foreground font-medium text-sm">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
