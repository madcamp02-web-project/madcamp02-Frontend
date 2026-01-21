"use client";

import React, { useEffect, useRef, useState } from 'react';
import WidgetCard from './WidgetCard';
import { useStockStore } from '@/stores/stock-store';
import { createChart, ColorType, CandlestickData, Time, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { CandleItem } from '@/types/api';
import { socketClient } from '@/lib/api/socket-client';

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

export default function AssetChart() {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    // 실시간 캔들을 시간별로 캐싱하기 위한 Map (time -> candle)
    const realtimeCandlesRef = useRef<Map<number, CandlestickData<Time>>>(new Map());
    const {
        prices,
        currentQuote,
        candles,
        searchResults,
        fetchCandles,
        fetchQuote,
        searchStocks,
        isLoading,
        error,
        updateQuoteFromWebSocket,
        updateQuoteFromWebSocketMessage,
        addRealtimeTrade,
        realtimeTrades,
        selectedTicker,
        setSelectedTicker,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
    } = useStockStore();

    const [timeframe, setTimeframe] = useState<string>('d'); // 기본값: d (일봉)
    const [timeframeError, setTimeframeError] = useState<string | null>(null); // timeframe 에러 추적
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
    const [lastFetchedTicker, setLastFetchedTicker] = useState<string>('');
    const [lastFetchedTimeframe, setLastFetchedTimeframe] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false); // 클라이언트 마운트 상태
    const lastCandleRef = useRef<CandlestickData<Time> | null>(null); // 마지막 캔들 참조 (실시간 업데이트용)
    const { theme } = useTheme();

    // 클라이언트에서만 마운트 확인
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 선택된 종목의 현재가 정보
    const quote = currentQuote?.ticker === selectedTicker ? currentQuote : null;
    const priceData = prices[selectedTicker];
    const displayData = quote || priceData;

    // 종목명과 거래소 정보 (searchResults에서 찾기)
    const selectedStock = searchResults?.items?.find(s => s.symbol === selectedTicker);
    const stockName = selectedStock?.name || (selectedTicker === 'AAPL' ? 'Apple Inc.' : selectedTicker);
    const stockExchange = selectedStock?.exchange || (selectedTicker === 'AAPL' ? 'NASDAQ' : '');

    // 초기 로드: 기본 종목 정보 가져오기 (종목명만)
    useEffect(() => {
        if (selectedTicker === 'AAPL' && !searchResults) {
            searchStocks('AAPL').catch((err) => {
                console.error('[AssetChart] Failed to search AAPL:', err);
            });
        }
    }, [selectedTicker, searchResults, searchStocks]);

    // 가격 정보는 WebSocket으로 수신하므로 초기 API 호출 최소화
    // 백엔드 StockQuoteBroadcastService가 5초마다 활성 구독 종목의 Quote 데이터 브로드캐스트

    // 차트 데이터 로드
    // 가격 정보는 WebSocket으로 수신하므로 fetchQuote는 선택적 (캐시된 데이터가 있으면 사용)
    useEffect(() => {
        if (selectedTicker) {
            // 'all' 선택 시에는 'd' (일봉) 데이터를 가져오되, 차트에는 전체 표시
            const fetchTimeframe = timeframe === 'all' ? 'd' : timeframe;
            console.log('[AssetChart] 차트 데이터 로드 시작:', { selectedTicker, timeframe, fetchTimeframe });
            setLastFetchedTicker(selectedTicker);
            setLastFetchedTimeframe(timeframe);

            // 차트 데이터는 API로 가져오기 ('all'일 때는 'd' 데이터 사용)
            fetchCandles(selectedTicker, fetchTimeframe)
                .then((response) => {
                    console.log('[AssetChart] fetchCandles 완료:', {
                        selectedTicker,
                        timeframe,
                        itemsCount: response?.items?.length || 0,
                        hasWarning: !!response?.warning,
                        warning: response?.warning,
                    });

                    // 경고 메시지는 표시하지 않음 - WebSocket으로 실시간 데이터 수신
                    setTimeframeError(null);
                })
                .catch((err) => {
                    // 에러는 조용히 처리 - WebSocket으로 실시간 데이터 수신
                    console.error('[AssetChart] Failed to fetch candles (WebSocket으로 대체):', err);
                    setTimeframeError(null);
                });

            // 가격 정보는 WebSocket으로 수신하므로 초기 API 호출은 선택적
            // WebSocket 구독이 이미 설정되어 있으면 백엔드가 자동으로 Quote 데이터 브로드캐스트
            // 초기 표시를 위해 한 번만 호출 (캐시된 데이터가 있으면 사용)
            if (!prices[selectedTicker] || prices[selectedTicker].price === 0) {
                fetchQuote(selectedTicker).catch((err) => {
                    console.error('[AssetChart] fetchQuote failed (WebSocket으로 대체):', err);
                });
            }
        }
    }, [selectedTicker, timeframe, fetchCandles, fetchQuote, prices]);

    // candles 데이터가 변경되면 차트 업데이트
    useEffect(() => {
        console.log('[AssetChart] candles 상태 변경:', {
            candles,
            ticker: candles?.ticker,
            resolution: candles?.resolution,
            stale: candles?.stale,
            hasItems: (candles?.items?.length ?? 0) > 0,
            itemsLength: candles?.items?.length ?? 0,
            selectedTicker,
            timeframe,
            lastFetchedTicker,
            lastFetchedTimeframe,
            isLoading,
        });

        // candles가 있고, 현재 선택된 종목/시간대의 데이터인지 확인
        // 백엔드에서 ticker와 resolution을 반환하므로 매칭 확인
        if (candles?.items && candles.items.length > 0) {
            // ticker와 resolution이 일치하는지 확인 (선택적, 백엔드가 보장할 수도 있음)
            const isMatchingData = !candles.ticker || candles.ticker === selectedTicker;

            if (!isMatchingData) {
                console.warn('[AssetChart] 다른 종목의 데이터입니다:', {
                    expected: selectedTicker,
                    received: candles.ticker,
                });
            }

            console.log('[AssetChart] 차트 데이터 변환 시작, items 개수:', candles.items.length, 'timeframe:', timeframe);
            const convertedData = convertCandlesToChartData(candles.items);
            console.log('[AssetChart] 변환된 차트 데이터:', {
                originalLength: candles.items.length,
                convertedLength: convertedData.length,
                timeframe,
                first: convertedData[0],
                last: convertedData[convertedData.length - 1],
            });

            if (convertedData.length === 0) {
                console.warn('[AssetChart] 변환된 데이터가 비어있습니다. 원본 items:', candles.items.slice(0, 3));
            }

            setChartData(convertedData);

            // 마지막 캔들 저장 (실시간 업데이트용)
            if (convertedData.length > 0) {
                lastCandleRef.current = convertedData[convertedData.length - 1];
            }

            // 차트가 이미 초기화되어 있으면 즉시 데이터 업데이트
            if (seriesRef.current && convertedData.length > 0 && chartRef.current) {
                try {
                    seriesRef.current.setData(convertedData);

                    // 최신 데이터 중심으로 보이도록 설정
                    const firstTime = convertedData[0].time;
                    const lastTime = convertedData[convertedData.length - 1].time;
                    const firstTimeValue = typeof firstTime === 'number' ? firstTime : new Date(firstTime as string).getTime() / 1000;
                    const lastTimeValue = typeof lastTime === 'number' ? lastTime : new Date(lastTime as string).getTime() / 1000;

                    // timeframe에 따라 보이는 범위 결정
                    // 'all' 선택 시 전체 데이터 표시, 그 외에는 최신 데이터 중심으로 표시
                    if (timeframe === 'all') {
                        // 전체 데이터 표시
                        chartRef.current.timeScale().fitContent();
                    } else {
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

                    console.log('[AssetChart] 차트에 데이터 설정 완료:', convertedData.length);
                } catch (err) {
                    console.error('[AssetChart] 차트 데이터 설정 실패:', err);
                }
            } else {
                console.log('[AssetChart] 차트가 아직 초기화되지 않음, chartData state에 저장됨');
            }
        } else {
            console.warn('[AssetChart] candles 데이터가 없거나 비어있습니다:', {
                candles: candles ? '존재함' : 'null',
                ticker: candles?.ticker,
                resolution: candles?.resolution,
                items: candles?.items ? `배열 길이: ${candles.items.length}` : '없음',
                isLoading,
            });
            setChartData([]);
        }
    }, [candles, selectedTicker, timeframe, lastFetchedTicker, lastFetchedTimeframe, isLoading]);

    // WebSocket 구독: 실시간 가격 업데이트
    useEffect(() => {
        if (!selectedTicker) return;

        let subscription: any = null;

        const setupSubscription = async () => {
            // 연결이 안 되어 있으면 연결 시도
            if (!socketClient.isConnected()) {
                // WebSocket 연결 실패 시에도 조용히 처리 - 재연결 시도
                await socketClient.connect().catch((error) => {
                    // 에러는 조용히 처리 - 백그라운드에서 재연결 시도
                    console.error('[AssetChart] STOMP Connection failed (재연결 시도):', error);
                    return;
                });
            }

            const destination = `/topic/stock.ticker.${selectedTicker}`;
            subscription = await socketClient.subscribe(destination, (message) => {
                try {
                    const data = JSON.parse(message.body);
                    console.log('[AssetChart] WebSocket 실시간 데이터 수신:', data);

                    // WebSocket 메시지 구조: { ticker, price, ts, volume, source, rawType, conditions }
                    const ticker = data.ticker || selectedTicker;
                    const price = data.price;
                    const volume = data.volume || 0;
                    const timestamp = data.ts || Date.now();

                    // 실시간 trade 데이터가 있으면 차트용으로 저장
                    if (data.rawType === 'trade' && volume > 0) {
                        addRealtimeTrade(ticker, price, volume, timestamp);
                    }

                    // currentQuote 업데이트 (실시간 주가 정보 반영)
                    updateQuoteFromWebSocket(ticker, price, volume, timestamp);
                } catch (error) {
                    console.error('[AssetChart] Failed to parse price update:', error);
                }
            });
        };

        setupSubscription();

        return () => {
            if (subscription) {
                socketClient.unsubscribe(`/topic/stock.ticker.${selectedTicker}`);
            }
        };
    }, [selectedTicker, updateQuoteFromWebSocket, updateQuoteFromWebSocketMessage, addRealtimeTrade]);

    // WebSocket 실시간 trade 데이터를 차트에 반영 (최신 트레이딩 데이터)
    useEffect(() => {
        if (!selectedTicker || !seriesRef.current || !chartRef.current) return;

        const trades = realtimeTrades.get(selectedTicker);
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
        if (!seriesRef.current || !chartRef.current) {
            return;
        }

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
                seriesRef.current!.update(candle);

                // 마지막 캔들 참조 업데이트
                if (!lastCandleRef.current ||
                    (typeof lastCandleRef.current.time === 'number' ? lastCandleRef.current.time : Math.floor(new Date(lastCandleRef.current.time as string).getTime() / 1000)) < candleTime) {
                    lastCandleRef.current = candle;
                }

                // 최신 데이터가 보이도록 스크롤
                chartRef.current!.timeScale().scrollToPosition(1, false);
            } catch (error) {
                console.error('[AssetChart] 실시간 캔들 업데이트 실패:', error);
            }
        });
    }, [realtimeTrades, selectedTicker, timeframe]);

    // WebSocket 실시간 가격 업데이트를 차트에 반영 (fallback)
    useEffect(() => {
        if (!selectedTicker || !seriesRef.current || !chartRef.current || !lastCandleRef.current) return;

        const priceData = prices[selectedTicker];
        if (!priceData) return;

        // 실시간 trade 데이터가 있으면 그것을 우선 사용 (위의 useEffect에서 처리)
        const trades = realtimeTrades.get(selectedTicker);
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
                console.error('[AssetChart] 실시간 캔들 업데이트 실패:', error);
            }
        }
    }, [prices, selectedTicker, timeframe, realtimeTrades]);

    // 종목 검색
    const handleSearch = async (keyword: string) => {
        if (keyword.trim().length >= 2) {
            try {
                await searchStocks(keyword);
                setShowSearchResults(true);
            } catch (error) {
                console.error('[AssetChart] Search failed:', error);
            }
        } else {
            setShowSearchResults(false);
        }
    };

    // 종목 선택
    const handleSelectStock = (ticker: string) => {
        setSelectedTicker(ticker);
        setSearchKeyword('');
        setShowSearchResults(false);
    };

    // 차트 초기화 (차트 컨테이너가 렌더링되고 데이터가 있을 때)
    useEffect(() => {
        // 차트 컨테이너가 없거나 이미 초기화되었으면 리턴
        if (!chartContainerRef.current) {
            return;
        }
        if (chartRef.current) {
            return;
        }

        // chartData가 없으면 초기화하지 않음 (컨테이너가 렌더링되지 않음)
        if (chartData.length === 0) {
            return;
        }

        console.log('[AssetChart] 차트 초기화 시작...', { chartDataLength: chartData.length, timeframe });

        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#1f2937';
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
            height: 380, // 하단 시간 축을 위한 여유 공간 추가
            timeScale: {
                borderColor: borderColor,
                timeVisible: true,
                secondsVisible: false,
                // 하단 시간 축이 잘리지 않도록 최소 높이 설정 (공식 문서 권장)
                minimumHeight: 40, // 시간 축 레이블을 위한 충분한 공간 확보
                // 차트가 잘리지 않도록 여백 설정
                rightOffset: 5,
                rightOffsetPixels: 10, // 픽셀 단위 오른쪽 여백 (최신 버전)
                barSpacing: 2,
                // 시간 축 표시 설정
                visible: true,
                borderVisible: true,
            },
            rightPriceScale: {
                borderColor: borderColor,
                // 가격 축이 잘리지 않도록 여백 추가
                scaleMargins: {
                    top: 0.05,
                    bottom: 0.05,
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
            // 차트 스크롤 및 확대/축소 설정
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
                mouseWheel: true,
                pinch: true,
            },
        });

        // v5 API: use addSeries with CandlestickSeries
        // timeframe에 따라 캔들 크기 조정
        // 각 기간별로 명확하게 구분되도록 크기 차이를 크게 설정


        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444',
            downColor: '#266bcaff',
            borderUpColor: '#ef4444',
            borderDownColor: '#266bcaff',
            wickUpColor: '#ef4444',
            wickDownColor: '#266bcaff',
            priceLineWidth: 2, // 일봉 기준(2)으로 통일 (점선 크기 고정)
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        console.log('[AssetChart] 차트 초기화 완료, chartData 대기 중:', chartData.length);

        // 차트 초기화 직후 chartData가 있으면 즉시 설정
        if (chartData.length > 0) {
            try {
                candlestickSeries.setData(chartData);

                // 최신 데이터 중심으로 보이도록 설정
                const firstTime = chartData[0].time;
                const lastTime = chartData[chartData.length - 1].time;
                const firstTimeValue = typeof firstTime === 'number' ? firstTime : new Date(firstTime as string).getTime() / 1000;
                const lastTimeValue = typeof lastTime === 'number' ? lastTime : new Date(lastTime as string).getTime() / 1000;

                // timeframe에 따라 보이는 범위 결정
                // 'all' 선택 시 전체 데이터 표시, 그 외에는 최신 데이터 중심으로 표시
                if (timeframe === 'all') {
                    // 전체 데이터 표시
                    chart.timeScale().fitContent();
                } else {
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
                    chart.timeScale().setVisibleRange({
                        from: visibleRange.from as Time,
                        to: visibleRange.to as Time,
                    });
                }

                // 시간 축이 제대로 표시되도록 차트 크기 재조정 (공식 문서 권장)
                // 차트가 렌더링된 후 시간 축이 잘리지 않도록 보장
                setTimeout(() => {
                    if (chart && chartContainerRef.current) {
                        const containerHeight = chartContainerRef.current.clientHeight;
                        if (containerHeight > 0) {
                            chart.applyOptions({ height: containerHeight });
                        }
                    }
                }, 100);

                console.log('[AssetChart] 차트 초기화 후 즉시 데이터 설정 완료:', chartData.length);
            } catch (err) {
                console.error('[AssetChart] 차트 초기화 후 데이터 설정 실패:', err);
            }
        }

        // Handle resize with ResizeObserver for better accuracy
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                chart.applyOptions({ width: entry.contentRect.width });
            }
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        // 자동 timeframe 전환 제거 - 사용자가 수동으로 DWM 버튼을 선택하도록 함

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [theme, chartData.length, timeframe]); // timeframe 변경 시 차트 재생성하여 캔들 크기 업데이트

    // 차트 데이터가 변경되면 차트에 반영
    useEffect(() => {
        if (seriesRef.current && chartData.length > 0 && chartRef.current) {
            try {
                // currentQuote가 있고 chartData의 마지막 데이터보다 최신이거나 가격이 다르면 추가
                let finalChartData = [...chartData];
                if (currentQuote && currentQuote.ticker === selectedTicker) {
                    const lastCandle = chartData[chartData.length - 1];
                    const lastTime = typeof lastCandle.time === 'number' ? lastCandle.time : new Date(lastCandle.time as string).getTime() / 1000;

                    // 현재가 캔들 생성
                    // DB 데이터가 과거인 경우 현재가로 캔들을 만들어 이어붙임
                    // 단, 이미 오늘 날짜의 캔들이 있으면 업데이트 (여기서는 단순히 append 처리로 시각적 연결)
                    const now = Math.floor(Date.now() / 1000);

                    // 마지막 캔들로부터 1일 이상 차이나면 새로운 캔들 추가
                    if (now - lastTime > 86400 || Math.abs(lastCandle.close - currentQuote.price) > 0.01) {
                        const currentCandle: CandlestickData<Time> = {
                            time: now as Time,
                            open: currentQuote.open || currentQuote.price,
                            high: currentQuote.high || currentQuote.price,
                            low: currentQuote.low || currentQuote.price,
                            close: currentQuote.price,
                        };
                        finalChartData.push(currentCandle);
                        console.log('[AssetChart] 현재가 캔들 추가:', currentCandle);
                    }
                }

                seriesRef.current.setData(finalChartData);

                // 최신 데이터 중심으로 보이도록 설정
                const firstTime = finalChartData[0].time;
                const lastTime = finalChartData[finalChartData.length - 1].time;
                const firstTimeValue = typeof firstTime === 'number' ? firstTime : new Date(firstTime as string).getTime() / 1000;
                const lastTimeValue = typeof lastTime === 'number' ? lastTime : new Date(lastTime as string).getTime() / 1000;

                // timeframe에 따라 보이는 범위 결정
                // 'all' 선택 시 전체 데이터 표시, 그 외에는 최신 데이터 중심으로 표시
                if (timeframe === 'all') {
                    // 전체 데이터 표시
                    chartRef.current.timeScale().fitContent();
                } else {
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
                        const from = Math.max(lastTimeValue - (visibleDays * 86400), firstTimestamp);

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

                console.log('[AssetChart] chartData 변경으로 차트 업데이트 완료:', chartData.length);
            } catch (err) {
                console.error('[AssetChart] 차트 업데이트 실패:', err);
            }
        } else if (chartData.length > 0 && !seriesRef.current) {
            console.log('[AssetChart] 차트가 아직 초기화되지 않음, chartData 대기 중:', chartData.length);
        }
    }, [chartData, timeframe]);

    // 테마 변경 시 차트 스타일 업데이트
    useEffect(() => {
        if (!chartRef.current) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#9ca3af' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)';
        const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        chartRef.current.applyOptions({
            layout: { textColor },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            timeScale: { borderColor },
            rightPriceScale: { borderColor },
        });
    }, [theme]);

    return (
        <WidgetCard className="min-h-[350px] flex flex-col" allowOverflow={true}>
            {/* 1. Header Row: Stock Info + Search */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{selectedTicker}</h2>
                    {stockName && (
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm font-medium">{stockName}</span>
                            {stockExchange && (
                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{stockExchange}</span>
                            )}
                        </div>
                    )}

                    {/* Watchlist Toggle */}
                    <button
                        onClick={() => {
                            if (watchlist.includes(selectedTicker)) {
                                removeFromWatchlist(selectedTicker);
                            } else {
                                addToWatchlist(selectedTicker);
                            }
                        }}
                        className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors ml-1"
                        title={watchlist.includes(selectedTicker) ? "관심종목 제거" : "관심종목 추가"}
                    >
                        {watchlist.includes(selectedTicker) ? (
                            <span className="text-yellow-500 text-xl">★</span>
                        ) : (
                            <span className="text-muted-foreground hover:text-yellow-500 text-xl">☆</span>
                        )}
                    </button>
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
                        value={searchKeyword}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchKeyword(value);
                            handleSearch(value);
                        }}
                        onFocus={() => {
                            if (searchResults?.items && searchResults.items.length > 0) {
                                setShowSearchResults(true);
                            }
                        }}
                        onBlur={() => {
                            // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록 함
                            setTimeout(() => setShowSearchResults(false), 200);
                        }}
                        className="bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-accent rounded-xl py-2 pl-9 pr-4 text-xs w-[180px] transition-all outline-none"
                    />
                    {/* 검색 결과 드롭다운 */}
                    {showSearchResults && searchResults?.items && searchResults.items.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            {searchResults.items.slice(0, 5).map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleSelectStock(stock.symbol)}
                                    className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors flex items-center justify-between"
                                >
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{stock.symbol}</div>
                                        {stock.name && (
                                            <div className="text-xs text-muted-foreground">{stock.name}</div>
                                        )}
                                    </div>
                                    {stock.exchange && (
                                        <span className="text-xs text-muted-foreground">{stock.exchange}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Price Row + Time Selector - WebSocket 실시간 업데이트 */}
            <div className="flex justify-between items-end mb-6 border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        {/* 가격 정보는 WebSocket으로 실시간 업데이트 (EOD 기준) */}
                        <span className="text-2xl font-bold text-foreground tracking-tighter">
                            ${displayData?.price && displayData.price > 0
                                ? displayData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '--'}
                        </span>
                        {displayData && displayData.price && displayData.price > 0 && (
                            <div className={`flex flex-col items-start px-2 py-1 rounded-lg ${(displayData.change || 0) >= 0
                                ? 'text-red-500 bg-red-500/10'
                                : 'text-blue-500 bg-blue-500/10'
                                }`}>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold">
                                        {displayData.change !== undefined ? (displayData.change > 0 ? '+' : '') + displayData.change.toFixed(2) : '--'}
                                    </span>
                                    <span className="text-xs font-semibold opacity-90">
                                        ({displayData.changePercent !== undefined ? (displayData.changePercent > 0 ? '+' : '') + displayData.changePercent.toFixed(2) : '--'}%)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* EOD 기준 명시 */}
                    <span className="text-[10px] text-muted-foreground/70">
                        EOD (End of Day) 기준
                    </span>
                </div>

                {/* Time Range Selector */}
                {/* D (일봉), W (주봉), M (월봉), (전체) 4개 버튼 */}
                <div className="flex bg-secondary p-1 rounded-xl overflow-hidden mb-1">
                    {[
                        { label: 'D', value: 'd', description: '일봉' },
                        { label: 'W', value: 'w', description: '주봉' },
                        { label: 'M', value: 'm', description: '월봉' },
                        { label: '전체', value: 'all', description: '전체 데이터' },
                    ].map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setTimeframe(value);
                                // timeframe 변경 시 useEffect가 자동으로 fetchCandles 호출하므로 중복 호출 제거
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === value
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Stats Grid - WebSocket 실시간 업데이트 반영 */}
            <div className="grid grid-cols-6 gap-2 mb-4 pb-4 border-b border-border text-sm">
                {/* 시가(Open) - 실시간 업데이트 */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">시가(Open)</span>
                    <span className="text-foreground font-bold tracking-tight">
                        ${displayData?.open !== undefined ? displayData.open.toFixed(2) : '--'}
                    </span>
                </div>
                {/* 고가(High) - 실시간 업데이트 */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">고가(High)</span>
                    <span className="text-red-500 font-bold tracking-tight">
                        ${displayData?.high !== undefined ? displayData.high.toFixed(2) : '--'}
                    </span>
                </div>
                {/* 저가(Low) - 실시간 업데이트 */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">저가(Low)</span>
                    <span className="text-blue-500 font-bold tracking-tight">
                        ${displayData?.low !== undefined ? displayData.low.toFixed(2) : '--'}
                    </span>
                </div>
                {/* 종가(Close) - 실시간 업데이트 (현재가와 동일) */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">종가(Close)</span>
                    <span className="text-foreground font-bold tracking-tight">
                        ${displayData?.price !== undefined ? displayData.price.toFixed(2) : '--'}
                    </span>
                </div>
                {/* 전일가(Prev) - 초기 API 호출에서만 설정 */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">전일가(Prev)</span>
                    <span className="text-muted-foreground font-bold tracking-tight">
                        ${quote?.previousClose !== undefined ? quote.previousClose.toFixed(2) : '--'}
                    </span>
                </div>
                {/* 거래량(Vol) - 실시간 업데이트 */}
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs mb-1">거래량(Vol)</span>
                    <span className="text-foreground font-bold tracking-tight">
                        {displayData?.volume !== undefined && displayData.volume > 0
                            ? ((displayData.volume / 1000000).toFixed(1)) + 'M'
                            : '--'}
                    </span>
                </div>
            </div>

            {/* 3. Chart Area */}
            {isLoading && chartData.length === 0 ? (
                <div className="flex-1 w-full min-h-[250px] rounded-lg flex flex-col items-center justify-center bg-background dark:bg-[#0a0a0c]">
                    <div className="text-muted-foreground mb-2">차트 데이터를 불러오는 중...</div>
                    <div className="text-xs text-muted-foreground/70">{selectedTicker} ({timeframe === 'all' ? '전체' : timeframe})</div>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex-1 w-full min-h-[250px] rounded-lg flex flex-col items-center justify-center bg-background dark:bg-[#0a0a0c] p-4">
                    {/* 에러 메시지 제거 - WebSocket으로 실시간 데이터 수신 */}
                    <div className="text-muted-foreground mb-2">차트 데이터 로딩 중...</div>
                    <div className="text-xs text-muted-foreground/70">{selectedTicker} ({timeframe === 'all' ? '전체' : timeframe})</div>
                </div>
            ) : (
                <>
                    {/* 경고 메시지 제거 - WebSocket으로 실시간 데이터 수신 */}
                    <div
                        ref={chartContainerRef}
                        className="flex-1 w-full min-h-[250px] rounded-lg overflow-hidden bg-background dark:bg-[#0a0a0c]"
                        suppressHydrationWarning
                        style={{ paddingBottom: 0 }}
                    />
                </>
            )}
        </WidgetCard>
    );
}
