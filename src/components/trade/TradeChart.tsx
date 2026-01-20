"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useStockStore } from '@/stores/stock-store';
import { createChart, ColorType, CandlestickData, Time, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { CandleItem } from '@/types/api';
import { socketClient } from '@/lib/api/socket-client';

interface TradeChartProps {
    ticker: string;
    timeframe?: string;
}

// 백엔드 API 응답을 Lightweight Charts 형식으로 변환
// 백엔드에서 정확한 날짜 범위의 데이터를 제공하므로 샘플링 없이 그대로 변환
function convertCandlesToChartData(candles: CandleItem[]): CandlestickData<Time>[] {
    if (!candles || candles.length === 0) return [];
    
    // 시간순으로 정렬 후 Lightweight Charts 형식으로 변환
    return candles.map(candle => {
        const time = candle.timestamp as Time;
        return {
            time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        };
    }).sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime() / 1000;
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime() / 1000;
        return timeA - timeB;
    });
}

export default function TradeChart({ ticker, timeframe = 'd' }: TradeChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const { candles, fetchCandles, isLoading, prices, realtimeTrades } = useStockStore();
    const { theme } = useTheme();
    const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
    const [isMounted, setIsMounted] = useState(false); // 클라이언트 마운트 상태
    const lastCandleRef = useRef<CandlestickData<Time> | null>(null); // 마지막 캔들 참조 (실시간 업데이트용)
    const realtimeCandlesRef = useRef<Map<number, CandlestickData<Time>>>(new Map()); // 실시간 캔들 캐시 (timestamp -> candle)

    // 클라이언트에서만 마운트 확인
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 차트 데이터 로드
    // fetchCandles는 Zustand store 함수로 안정적인 참조를 유지하지만, 의존성에서 제외하여 불필요한 재실행 방지
    useEffect(() => {
        if (ticker) {
            fetchCandles(ticker, timeframe).catch((err) => {
                console.error('[TradeChart] Failed to fetch candles:', err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticker, timeframe]); // fetchCandles 제외

    // candles 데이터가 변경되면 차트 업데이트
    // ticker와 timeframe이 일치하는 경우에만 업데이트하여 무한 루프 방지
    useEffect(() => {
        // 현재 ticker와 timeframe에 해당하는 데이터인지 확인
        if (candles?.ticker !== ticker || candles?.resolution !== timeframe) {
            return; // 다른 ticker/timeframe의 데이터는 무시
        }
        
        if (candles?.items && candles.items.length > 0) {
            console.log('[TradeChart] 차트 데이터 변환 시작, items 개수:', candles.items.length, 'timeframe:', timeframe);
            const convertedData = convertCandlesToChartData(candles.items);
            console.log('[TradeChart] 변환된 차트 데이터:', {
                originalLength: candles.items.length,
                convertedLength: convertedData.length,
                timeframe,
                first: convertedData[0],
                last: convertedData[convertedData.length - 1],
            });
            
            // 중복 업데이트 방지: chartData가 이미 동일한지 확인
            const currentDataLength = chartData.length;
            if (currentDataLength === convertedData.length && currentDataLength > 0) {
                // 첫 번째와 마지막 캔들 시간 비교
                const currentFirstTime = chartData[0]?.time;
                const newFirstTime = convertedData[0]?.time;
                const currentLastTime = chartData[currentDataLength - 1]?.time;
                const newLastTime = convertedData[convertedData.length - 1]?.time;
                
                if (currentFirstTime === newFirstTime && currentLastTime === newLastTime) {
                    console.log('[TradeChart] 동일한 데이터이므로 업데이트 스킵');
                    return; // 동일한 데이터이면 업데이트하지 않음
                }
            }
            
            setChartData(convertedData);
            
            // 마지막 캔들 저장 (실시간 업데이트용)
            if (convertedData.length > 0) {
                lastCandleRef.current = convertedData[convertedData.length - 1];
            }
            
            // 차트가 이미 초기화되어 있으면 데이터 업데이트
            if (seriesRef.current && chartRef.current) {
                // timeframe에 따라 캔들 크기 업데이트
                const getCandleWidth = (tf: string): number => {
                    switch (tf) {
                        case 'd': return 2; // 일봉: 얇은 캔들
                        case 'w': return 4; // 주봉: 중간 캔들
                        case 'm': return 6; // 월봉: 두꺼운 캔들
                        default: return 2;
                    }
                };
                
                seriesRef.current.setData(convertedData);
                seriesRef.current.applyOptions({
                    priceLineWidth: getCandleWidth(timeframe),
                });
                
                // 최신 데이터 중심으로 보이도록 설정
                if (convertedData.length > 0) {
                    const firstTime = convertedData[0].time;
                    const lastTime = convertedData[convertedData.length - 1].time;
                    const firstTimeValue = typeof firstTime === 'number' ? firstTime : new Date(firstTime as string).getTime() / 1000;
                    const lastTimeValue = typeof lastTime === 'number' ? lastTime : new Date(lastTime as string).getTime() / 1000;
                    
                    // timeframe에 따라 보이는 범위 결정 (최신 데이터 중심)
                    const getVisibleRange = (tf: string, firstTimestamp: number, lastTimestamp: number): { from: number; to: number } => {
                        const now = Math.floor(Date.now() / 1000);
                        let visibleDays = 30; // 기본값: 30일
                        
                        switch (tf) {
                            case 'd': visibleDays = 30; break; // 일봉: 최근 30일
                            case 'w': visibleDays = 84; break; // 주봉: 최근 12주 (84일)
                            case 'm': visibleDays = 365; break; // 월봉: 최근 12개월 (365일)
                        }
                        
                        // 최신 데이터 중심으로, 데이터가 있는 범위 내에서만
                        const to = Math.min(lastTimestamp, now);
                        const from = Math.max(lastTimestamp - (visibleDays * 86400), firstTimestamp);
                        
                        return { from, to };
                    };
                    
                    const visibleRange = getVisibleRange(timeframe, firstTimeValue, lastTimeValue);
                    chartRef.current.timeScale().setVisibleRange({
                        from: visibleRange.from as Time,
                        to: visibleRange.to as Time,
                    });
                }
                
                // 시간 축이 제대로 표시되도록 차트 크기 재조정 (공식 문서 권장)
                // 차트가 렌더링된 후 시간 축이 잘리지 않도록 보장
                setTimeout(() => {
                    if (chartRef.current && chartContainerRef.current) {
                        const containerHeight = chartContainerRef.current.clientHeight;
                        if (containerHeight > 0) {
                            chartRef.current.applyOptions({ height: containerHeight });
                        }
                    }
                }, 100);
                
                console.log('[TradeChart] 차트 데이터 업데이트 완료:', convertedData.length, '개 데이터, 캔들 크기:', getCandleWidth(timeframe));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candles?.ticker, candles?.resolution, candles?.items, timeframe, ticker]); // chartData 제외하여 무한 루프 방지

    // WebSocket 실시간 trade 데이터를 차트에 반영 (최신 트레이딩 데이터)
    useEffect(() => {
        if (!ticker || !seriesRef.current || !chartRef.current) return;

        const trades = realtimeTrades.get(ticker);
        if (!trades || trades.length === 0) return;

        // timeframe에 따라 캔들 집계 단위 결정
        const getCandleInterval = (tf: string): number => {
            switch (tf) {
                case 'd': return 60; // 일봉: 1분 단위로 실시간 캔들 생성
                case 'w': return 300; // 주봉: 5분 단위
                case 'm': return 3600; // 월봉: 1시간 단위
                default: return 60;
            }
        };

        const interval = getCandleInterval(timeframe); // 초 단위
        const now = Math.floor(Date.now() / 1000);

        // 최근 trade들을 캔들 단위로 집계
        const candleMap = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();

        trades.forEach(trade => {
            const tradeTime = Math.floor(trade.timestamp / 1000); // 밀리초 -> 초
            const candleTime = Math.floor(tradeTime / interval) * interval; // 캔들 시간 (interval 단위로 내림)

            // 최근 1시간 이내의 trade만 처리
            if (now - tradeTime > 3600) return;

            if (!candleMap.has(candleTime)) {
                candleMap.set(candleTime, {
                    open: trade.price,
                    high: trade.price,
                    low: trade.price,
                    close: trade.price,
                    volume: trade.volume,
                });
            } else {
                const candle = candleMap.get(candleTime)!;
                candle.high = Math.max(candle.high, trade.price);
                candle.low = Math.min(candle.low, trade.price);
                candle.close = trade.price;
                candle.volume += trade.volume;
            }
        });

        // 집계된 캔들을 차트에 추가/업데이트
        candleMap.forEach((candleData, candleTime) => {
            const candle: CandlestickData<Time> = {
                time: candleTime as Time,
                open: candleData.open,
                high: candleData.high,
                low: candleData.low,
                close: candleData.close,
            };

            // 실시간 캔들 캐시에 저장
            realtimeCandlesRef.current.set(candleTime, candle);

            try {
                // 차트에 업데이트 (이미 있으면 업데이트, 없으면 추가)
                seriesRef.current.update(candle);
                
                // 마지막 캔들 참조 업데이트
                if (!lastCandleRef.current || 
                    (typeof lastCandleRef.current.time === 'number' ? lastCandleRef.current.time : Math.floor(new Date(lastCandleRef.current.time as string).getTime() / 1000)) < candleTime) {
                    lastCandleRef.current = candle;
                }

                // 최신 데이터가 보이도록 스크롤
                chartRef.current.timeScale().scrollToPosition(1, false);
            } catch (error) {
                console.error('[TradeChart] 실시간 캔들 업데이트 실패:', error);
            }
        });
    }, [realtimeTrades, ticker, timeframe]);

    // WebSocket 실시간 가격 업데이트를 차트에 반영 (fallback)
    useEffect(() => {
        if (!ticker || !seriesRef.current || !chartRef.current || !lastCandleRef.current) return;

        const priceData = prices[ticker];
        if (!priceData) return;

        // 실시간 trade 데이터가 있으면 그것을 우선 사용 (위의 useEffect에서 처리)
        const trades = realtimeTrades.get(ticker);
        if (trades && trades.length > 0) return;

        // 실시간 trade 데이터가 없을 때만 가격 데이터로 업데이트
        const currentTime = Math.floor(Date.now() / 1000);
        const lastCandleTime = typeof lastCandleRef.current.time === 'number' 
            ? lastCandleRef.current.time 
            : Math.floor(new Date(lastCandleRef.current.time as string).getTime() / 1000);

        const getTimeUnit = (tf: string): number => {
            switch (tf) {
                case 'd': return 86400; // 1일
                case 'w': return 604800; // 1주
                case 'm': return 2592000; // 약 1개월 (30일)
                default: return 86400;
            }
        };

        const timeUnit = getTimeUnit(timeframe);
        const timeDiff = currentTime - lastCandleTime;

        if (timeDiff < timeUnit) {
            // 같은 시간대: 마지막 캔들 업데이트
            const updatedCandle: CandlestickData<Time> = {
                ...lastCandleRef.current,
                close: priceData.price,
                high: Math.max(lastCandleRef.current.high, priceData.price),
                low: Math.min(lastCandleRef.current.low, priceData.price),
            };
            lastCandleRef.current = updatedCandle;
            
            try {
                seriesRef.current.update(updatedCandle);
            } catch (error) {
                console.error('[TradeChart] 실시간 캔들 업데이트 실패:', error);
            }
        }
    }, [prices, ticker, timeframe, realtimeTrades]);

    // 차트 초기화 (한 번만)
    useEffect(() => {
        if (!chartContainerRef.current || chartRef.current) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const crosshairColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        const labelBg = isDark ? '#1f2937' : '#ffffff';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: textColor,
                // 하단 시간 축이 잘리지 않도록 여백 추가
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 50, // 하단 시간 축을 위한 충분한 여백 (minimumHeight와 함께 사용)
                    left: 10,
                },
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            width: chartContainerRef.current.clientWidth,
            height: 320, // 하단 시간 축을 위한 여유 공간 추가
            timeScale: {
                borderColor: borderColor,
                timeVisible: true,
                secondsVisible: false,
                // 하단 시간 축이 잘리지 않도록 최소 높이 설정 (공식 문서 권장)
                minimumHeight: 40, // 시간 축 레이블을 위한 충분한 공간 확보
                // 차트가 가려지지 않도록 설정
                rightOffset: 10,
                rightOffsetPixels: 10, // 픽셀 단위 오른쪽 여백 (최신 버전)
                barSpacing: 2,
                // 시간 축 표시 설정
                visible: true,
                borderVisible: true,
            },
            rightPriceScale: {
                borderColor: borderColor,
                // 가격 축이 가려지지 않도록 여백 추가
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
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
            // 차트가 컨테이너 밖으로 나가도 보이도록 설정
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true,
                    price: true,
                },
                axisDoubleClickReset: {
                    time: true,
                    price: true,
                },
                axisTouchDrag: {
                    time: true,
                    price: true,
                },
                mouseWheel: true,
                pinch: true,
            },
        });

        // 캔들스틱 시리즈 추가
        // timeframe에 따라 캔들 크기 조정
        // 각 기간별로 명확하게 구분되도록 크기 차이를 크게 설정
        const getCandleWidth = (tf: string): number => {
            switch (tf) {
                case 'd': return 2; // 일봉: 얇은 캔들
                case 'w': return 4; // 주봉: 중간 캔들
                case 'm': return 6; // 월봉: 두꺼운 캔들
                default: return 2;
            }
        };
        
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',      // 빨간색 (상승)
            downColor: '#266bcaff',  // 파란색 (하락)
            borderUpColor: '#ef4444',
            borderDownColor: '#266bcaff',
            wickUpColor: '#ef4444',
            wickDownColor: '#266bcaff',
            priceLineWidth: getCandleWidth(timeframe), // timeframe에 따른 캔들 두께
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // 리사이즈 처리
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                chart.applyOptions({ width: entry.contentRect.width });
            }
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        // 자동 timeframe 전환 제거 - 사용자가 수동으로 DWM 버튼을 선택하도록 함

        // 클린업
        return () => {
            resizeObserver.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            seriesRef.current = null;
        };
    }, [theme, timeframe]); // theme 또는 timeframe 변경 시 재생성하여 캔들 크기 업데이트

    // 테마 변경 시 차트 스타일 업데이트
    useEffect(() => {
        if (!chartRef.current) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const crosshairColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
        const labelBg = isDark ? '#1f2937' : '#ffffff';

        chartRef.current.applyOptions({
            layout: {
                textColor: textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            timeScale: {
                borderColor: borderColor,
            },
            rightPriceScale: {
                borderColor: borderColor,
            },
            crosshair: {
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
    }, [theme]);

    // 차트 데이터 업데이트 (데이터가 변경되면)
    // 중복 업데이트 방지를 위해 이전 데이터와 비교
    useEffect(() => {
        if (!seriesRef.current || chartData.length === 0 || !chartRef.current) return;
        
        // 이미 동일한 데이터가 설정되어 있는지 확인 (무한 루프 방지)
        try {
            const currentSeriesData = seriesRef.current.data();
            if (currentSeriesData && currentSeriesData.length === chartData.length) {
                const currentLast = currentSeriesData[currentSeriesData.length - 1];
                const newLast = chartData[chartData.length - 1];
                if (currentLast?.time === newLast?.time && currentLast?.close === newLast?.close) {
                    console.log('[TradeChart] 차트 데이터가 이미 동일하므로 업데이트 스킵');
                    return;
                }
            }
        } catch (error) {
            // data() 호출 실패 시 무시하고 계속 진행
        }
        
        seriesRef.current.setData(chartData);
        
        // 최신 데이터 중심으로 보이도록 설정
        const firstTime = chartData[0].time;
        const lastTime = chartData[chartData.length - 1].time;
        const firstTimeValue = typeof firstTime === 'number' ? firstTime : new Date(firstTime as string).getTime() / 1000;
        const lastTimeValue = typeof lastTime === 'number' ? lastTime : new Date(lastTime as string).getTime() / 1000;
        
        // timeframe에 따라 보이는 범위 결정 (최신 데이터 중심)
        const getVisibleRange = (tf: string, firstTimestamp: number, lastTimestamp: number): { from: number; to: number } => {
            const now = Math.floor(Date.now() / 1000);
            let visibleDays = 30;
            
            switch (tf) {
                case 'd': visibleDays = 30; break; // 일봉: 최근 30일
                case 'w': visibleDays = 84; break; // 주봉: 최근 12주 (84일)
                case 'm': visibleDays = 365; break; // 월봉: 최근 12개월 (365일)
            }
            
            // 최신 데이터 중심으로, 데이터가 있는 범위 내에서만
            const to = Math.min(lastTimeValue, now);
            const from = Math.max(lastTimeValue - (visibleDays * 86400), firstTimeValue);
            
            return { from, to };
        };
        
        const visibleRange = getVisibleRange(timeframe, firstTimeValue, lastTimeValue);
        chartRef.current.timeScale().setVisibleRange({
            from: visibleRange.from as Time,
            to: visibleRange.to as Time,
        });
    }, [chartData, timeframe]);

    // 서버 사이드 렌더링 시에는 빈 div만 반환 (hydration mismatch 방지)
    if (!isMounted) {
        return (
            <div className="w-full h-full" suppressHydrationWarning>
                <div className="h-[300px] bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    차트 로딩 중...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full" suppressHydrationWarning>
            {isLoading && chartData.length === 0 ? (
                <div className="h-[320px] bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    차트 데이터를 불러오는 중...
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-[320px] bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                    차트 데이터가 없습니다
                </div>
            ) : (
                <div ref={chartContainerRef} className="w-full h-[320px] overflow-hidden pb-0" suppressHydrationWarning style={{ paddingBottom: 0 }} />
            )}
            {/* 경고 메시지 제거 - WebSocket으로 실시간 데이터 수신 */}
        </div>
    );
}
