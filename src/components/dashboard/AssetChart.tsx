"use client";

import React, { useEffect, useRef, useState } from 'react';
import WidgetCard from './WidgetCard';
import { useStockStore } from '@/stores/stock-store';
import { createChart, ColorType, CandlestickData, Time, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

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

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    labelBackgroundColor: '#1e1e24',
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    labelBackgroundColor: '#1e1e24',
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
    }, []);

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
            {/* 1. Header Row: Stock Info + Time Selector */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{ticker}</h2>
                    <span className="text-gray-400 text-sm">Apple Inc.</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">NASDAQ</span>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
                        <button
                            key={range}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === '1D'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Price Row */}
            <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-white">
                    ${data ? data.price.toFixed(2) : '167.20'}
                </span>
                <span className={`font-semibold px-3 py-2 rounded-lg text-sm ${(data?.change || 0) >= 0
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-red-500 bg-red-500/10'
                    }`}>
                    {data ? (data.change > 0 ? '+' : '') + data.change.toFixed(2) : '+17.00'}
                    <br />
                    ({data ? (data.changePercent > 0 ? '+' : '') + data.changePercent.toFixed(2) : '+11.32'}%)
                </span>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-6 gap-2.5 mb-4 pb-4 border-b border-white/5 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">시가(Open)</span>
                    <span className="text-white font-semibold">${data?.open?.toFixed(2) || '150.20'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">고가(High)</span>
                    <span className="text-red-400 font-semibold">${data?.high?.toFixed(2) || '167.85'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">저가(Low)</span>
                    <span className="text-blue-400 font-semibold">${data?.low?.toFixed(2) || '149.50'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">종가(Close)</span>
                    <span className="text-white font-semibold">${data?.price?.toFixed(2) || '167.20'}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">전일가(Prev)</span>
                    <span className="text-gray-400 font-semibold">$150.20</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-0.5">거래량(Vol)</span>
                    <span className="text-white font-semibold">{((data?.volume || 45200000) / 1000000).toFixed(1)}M</span>
                </div>
            </div>

            {/* 3. Chart Area */}
            <div
                ref={chartContainerRef}
                className="flex-1 w-full min-h-[250px] rounded-lg overflow-hidden"
                style={{ backgroundColor: '#0a0a0c' }}
            />
        </WidgetCard>
    );
}
