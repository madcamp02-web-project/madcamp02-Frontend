"use client";

import React, { useEffect, useRef, useState } from 'react';
import WidgetCard from './WidgetCard';
import { useStockStore } from '@/stores/stock-store';
import { createChart, ColorType, CandlestickData, Time, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useTheme } from 'next-themes';

// Generate initial mock candle data
function generateMockCandleData(): CandlestickData<Time>[] {
    const data: CandlestickData<Time>[] = [];
    let basePrice = 150;
    const now = Math.floor(Date.now() / 1000);

    for (let i = 60; i >= 0; i--) {
        const time = (now - i * 60) as Time; // 1-minute candles
        const open = basePrice + (Math.random() - 0.5) * 2;
        const close = open + (Math.random() - 0.5) * 3;
        const high = Math.max(open, close) + Math.random() * 1;
        const low = Math.min(open, close) - Math.random() * 1;

        data.push({ time, open, high, low, close });
        basePrice = close;
    }

    return data;
}

export default function AssetChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seriesRef = useRef<any>(null);
    const { prices, updatePrice } = useStockStore();
    const ticker = 'AAPL';
    const data = prices[ticker];
    const [candleData, setCandleData] = useState<CandlestickData<Time>[]>([]);
    const { theme } = useTheme();

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#1f2937'; // gray-400 : gray-800
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const crosshairColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        const labelBg = isDark ? '#1e1e24' : '#ffffff';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            timeScale: {
                borderColor: borderColor,
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: borderColor,
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: crosshairColor,
                    labelBackgroundColor: labelBg,
                },
                horzLine: {
                    color: crosshairColor,
                    labelBackgroundColor: labelBg,
                },
            },
        });

        // v5 API: use addSeries with CandlestickSeries
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#266bcaff',
            borderUpColor: '#ef4444',
            borderDownColor: '#266bcaff',
            wickUpColor: '#ef4444',
            wickDownColor: '#266bcaff',
        });

        // Set initial data
        const initialData = generateMockCandleData();
        candlestickSeries.setData(initialData);
        setCandleData(initialData);

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // Handle resize with ResizeObserver for better accuracy
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                chart.applyOptions({ width: entry.contentRect.width });
            }
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [theme]); // Re-create chart on theme change

    // Update chart with new data (simulate real-time updates)
    useEffect(() => {
        if (!seriesRef.current || candleData.length === 0) return;

        const interval = setInterval(() => {
            const lastCandle = candleData[candleData.length - 1];
            const now = Math.floor(Date.now() / 1000) as Time;

            // Create new candle or update current one
            const priceChange = (Math.random() - 0.5) * 0.5;
            const newClose = (lastCandle?.close || 167) + priceChange;

            const newCandle: CandlestickData<Time> = {
                time: now,
                open: lastCandle?.close || 167,
                high: Math.max(lastCandle?.close || 167, newClose) + Math.random() * 0.2,
                low: Math.min(lastCandle?.close || 167, newClose) - Math.random() * 0.2,
                close: newClose,
            };

            seriesRef.current?.update(newCandle);

            // Update store
            updatePrice({
                ticker,
                price: Number(newClose.toFixed(2)),
                open: 150.20,
                high: Math.max(168, newClose),
                low: Math.min(149.5, newClose),
                volume: 45200000 + Math.floor(Math.random() * 1000),
                change: newClose - 150.20,
                changePercent: ((newClose - 150.20) / 150.20) * 100,
                timestamp: Date.now(),
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [candleData, updatePrice]);

    return (
        <WidgetCard className="min-h-[350px] flex flex-col">
            {/* 1. Header Row: Stock Info + Search */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{ticker}</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-medium">Apple Inc.</span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">NASDAQ</span>
                    </div>
                </div>

                {/* Search Bar Input */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="종목 검색 (Search)"
                        className="bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-accent rounded-xl py-2 pl-9 pr-4 text-xs w-[180px] transition-all outline-none"
                    />
                </div>
            </div>

            {/* 2. Price Row + Time Selector */}
            <div className="flex justify-between items-end mb-6 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground tracking-tighter">
                        ${data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '167.20'}
                    </span>
                    <div className={`flex flex-col items-start px-2 py-1 rounded-lg ${(data?.change || 0) >= 0
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-blue-500 bg-blue-500/10'
                        }`}>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold">
                                {data ? (data.change > 0 ? '+' : '') + data.change.toFixed(2) : '+17.00'}
                            </span>
                            <span className="text-xs font-semibold opacity-90">
                                ({data ? (data.changePercent > 0 ? '+' : '') + data.changePercent.toFixed(2) : '+11.32'}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector (Moved Here, with Padding, Aligned Bottom) */}
                <div className="flex bg-secondary p-1 rounded-xl overflow-hidden mb-1">
                    {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
                        <button
                            key={range}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${range === '1D'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4 pb-4 border-b border-border text-sm">
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">시가(Open)</span>
                    <span className="text-foreground font-bold tracking-tight">${data?.open?.toFixed(2) || '150.20'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">고가(High)</span>
                    <span className="text-red-500 font-bold tracking-tight">${data?.high?.toFixed(2) || '168.00'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">저가(Low)</span>
                    <span className="text-blue-500 font-bold tracking-tight">${data?.low?.toFixed(2) || '149.50'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">종가(Close)</span>
                    <span className="text-foreground font-bold tracking-tight">${data?.price?.toFixed(2) || '162.02'}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">전일가(Prev)</span>
                    <span className="text-muted-foreground font-bold tracking-tight">$150.20</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">거래량(Vol)</span>
                    <span className="text-foreground font-bold tracking-tight">{((data?.volume || 45200000) / 1000000).toFixed(1)}M</span>
                </div>
            </div>

            {/* 3. Chart Area */}
            <div
                ref={chartContainerRef}
                className="flex-1 w-full min-h-[250px] rounded-lg overflow-hidden bg-background dark:bg-[#0a0a0c]"
            />
        </WidgetCard>
    );
}
