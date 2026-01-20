"use client";

import React, { useState, useEffect } from 'react';
import { useStockStore } from '@/stores/stock-store';
import { socketClient } from '@/lib/api/socket-client';

// 시간 차이 계산 헬퍼 함수
function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
}

// 거래량 포맷팅 헬퍼 함수
function formatVolume(volume: number): string {
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
}

export default function MarketNewsPage() {
    const [newsTab, setNewsTab] = useState<'all' | 'stock' | 'economy'>('all');
    const { 
        indices, 
        movers, 
        news, 
        isLoading, 
        error,
        isUsingCache,
        backendCache,
        fetchIndices, 
        fetchMovers, 
        fetchNews,
        updateIndices,
    } = useStockStore();

    useEffect(() => {
        // 페이지 로드 시 데이터 fetch
        // 에러는 각 함수 내부에서 처리되므로 catch는 선택적
        fetchIndices().catch((err) => {
            console.error('[MarketPage] fetchIndices failed:', err);
        });
        fetchMovers().catch((err) => {
            console.error('[MarketPage] fetchMovers failed:', err);
        });
        fetchNews().catch((err) => {
            console.error('[MarketPage] fetchNews failed:', err);
        });
    }, [fetchIndices, fetchMovers, fetchNews]);

    // WebSocket 구독: 실시간 지수 업데이트
    useEffect(() => {
        let subscription: any = null;

        const setupSubscription = async () => {
            // 연결이 안 되어 있으면 연결 시도
            if (!socketClient.isConnected()) {
                await socketClient.connect().catch((error) => {
                    console.error('[STOMP] Connection failed:', error);
                    return;
                });
            }

            subscription = await socketClient.subscribe('/topic/stock.indices', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    updateIndices(data);
                } catch (error) {
                    console.error('Failed to parse indices update:', error);
                }
            });
        };

        setupSubscription();

        return () => {
            if (subscription) {
                socketClient.unsubscribe('/topic/stock.indices');
            }
        };
    }, [updateIndices]);

    // 필터링된 뉴스
    const filteredNews = news?.items.filter(item => {
        if (newsTab === 'all') return true;
        // 뉴스 카테고리 매핑 (실제 API 응답에 따라 조정 필요)
        if (newsTab === 'stock') return item.source?.toLowerCase().includes('stock') || item.headline?.toLowerCase().includes('stock');
        if (newsTab === 'economy') return item.source?.toLowerCase().includes('economy') || item.headline?.toLowerCase().includes('economy');
        return true;
    }) || [];

    // Movers에서 급등/급락/거래량 상위 분리
    const risingStocks = movers?.items
        .filter(item => item.direction === 'UP')
        .slice(0, 5)
        .map((item, idx) => ({ ...item, rank: idx + 1 })) || [];
    
    const fallingStocks = movers?.items
        .filter(item => item.direction === 'DOWN')
        .slice(0, 5)
        .map((item, idx) => ({ ...item, rank: idx + 1 })) || [];
    
    const topVolumeStocks = movers?.items
        ? [...movers.items].sort((a, b) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 5)
            .map((item, idx) => ({ ...item, rank: idx + 1 }))
        : [];

    // 로딩 상태 (모든 데이터가 없고 로딩 중일 때만)
    if (isLoading && !indices && !movers && !news) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-muted-foreground">데이터를 불러오는 중...</div>
            </div>
        );
    }

    // 전체 에러 상태는 제거 - 일부 데이터가 있으면 계속 표시

    return (
        <div className="h-full w-full flex flex-col overflow-hidden" suppressHydrationWarning>
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
                <h1 className="text-2xl font-bold text-foreground">시장 현황</h1>
                <p className="text-muted-foreground text-sm">실시간 시장 동향 및 뉴스</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* 백엔드 Redis 캐시 상태 알림 (Phase 3.6) */}
                {(backendCache.indices?.status === 'STALE' || 
                  backendCache.movers?.status === 'STALE' || 
                  backendCache.news?.status === 'STALE') && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-blue-400 text-sm font-medium mb-1">
                            캐시된 데이터를 표시 중입니다
                        </div>
                        <div className="text-muted-foreground text-xs mb-2">
                            최신 데이터를 불러오는 중입니다. 잠시 후 자동으로 갱신됩니다.
                        </div>
                    </div>
                )}

                {/* 프론트엔드 localStorage 캐시 사용 알림 (백엔드 응답 없을 때만) */}
                {(isUsingCache.indices || isUsingCache.movers || isUsingCache.news) && 
                 !backendCache.indices && !backendCache.movers && !backendCache.news && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="text-yellow-400 text-sm font-medium mb-1">
                            로컬 캐시 데이터를 표시 중입니다
                        </div>
                        <div className="text-muted-foreground text-xs mb-2">
                            서버 연결을 확인하는 중입니다.
                        </div>
                    </div>
                )}

                {/* 에러 알림 (캐시도 없고 API도 실패한 경우) */}
                {error && !isUsingCache.indices && !isUsingCache.movers && !isUsingCache.news && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="text-yellow-400 text-sm font-medium mb-1">일부 데이터를 불러오지 못했습니다</div>
                        <div className="text-muted-foreground text-xs mb-2">{error}</div>
                        <button 
                            onClick={async () => {
                                // 에러 상태 초기화 후 재시도
                                await Promise.all([
                                    fetchIndices().catch((err) => console.error('[MarketPage] Retry fetchIndices failed:', err)),
                                    fetchMovers().catch((err) => console.error('[MarketPage] Retry fetchMovers failed:', err)),
                                    fetchNews().catch((err) => console.error('[MarketPage] Retry fetchNews failed:', err)),
                                ]);
                            }}
                            className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* Market Indices */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {indices?.items && indices.items.length > 0 ? indices.items.slice(0, 4).map((index) => {
                        const changePercent = index.changePercent ?? 0;
                        const value = index.value ?? 0;
                        const change = index.change ?? 0;
                        const isPositive = changePercent >= 0;
                        return (
                            <div key={index.code} className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-muted-foreground text-sm">{index.name}</span>
                                    <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '↗' : '↘'} {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-foreground mb-1">
                                    {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{change.toFixed(2)}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-4 text-center text-muted-foreground py-8">
                            지수 데이터를 불러올 수 없습니다
                        </div>
                    )}
                </div>

                {/* Stock Rankings */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Rising Stocks */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-green-400">🔥</span>
                            <h2 className="text-foreground font-bold">급등 종목</h2>
                        </div>
                        <div className="space-y-2">
                            {risingStocks.length > 0 ? risingStocks.map((stock) => (
                                <div key={stock.ticker} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-xs font-bold">
                                            {stock.rank}
                                        </span>
                                        <div>
                                            <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                            <div className="text-muted-foreground text-xs">{stock.ticker}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                        <div className="text-green-500 text-xs font-medium">+{stock.changePercent.toFixed(2)}%</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-muted-foreground text-sm py-4 text-center">데이터가 없습니다</div>
                            )}
                        </div>
                    </div>

                    {/* Falling Stocks */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-red-400">📉</span>
                            <h2 className="text-foreground font-bold">급락 종목</h2>
                        </div>
                        <div className="space-y-2">
                            {fallingStocks.length > 0 ? fallingStocks.map((stock) => (
                                <div key={stock.ticker} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xs font-bold">
                                            {stock.rank}
                                        </span>
                                        <div>
                                            <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                            <div className="text-muted-foreground text-xs">{stock.ticker}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                        <div className="text-red-500 text-xs font-medium">{stock.changePercent.toFixed(2)}%</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-muted-foreground text-sm py-4 text-center">데이터가 없습니다</div>
                            )}
                        </div>
                    </div>

                    {/* Top Volume */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400">⚡</span>
                            <h2 className="text-foreground font-bold">거래량 상위</h2>
                        </div>
                        <div className="space-y-2">
                            {topVolumeStocks.length > 0 ? topVolumeStocks.map((stock) => {
                                const isPositive = stock.changePercent >= 0;
                                return (
                                    <div key={stock.ticker} className="flex items-center justify-between py-2 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold">
                                                {stock.rank}
                                            </span>
                                            <div>
                                                <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                                <div className="text-muted-foreground text-xs">{formatVolume(stock.volume || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                            <div className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-muted-foreground text-sm py-4 text-center">데이터가 없습니다</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* News Section */}
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-400">⚡</span>
                            <h2 className="text-foreground font-bold">실시간 뉴스</h2>
                        </div>
                        <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                            전체보기
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {news?.items && news.items.length > 0 && filteredNews.length > 0 ? filteredNews.map((newsItem) => (
                            <div 
                                key={newsItem.id} 
                                className="bg-secondary border border-border rounded-xl p-4 hover:border-muted-foreground/30 transition-all cursor-pointer"
                                onClick={() => newsItem.url && window.open(newsItem.url, '_blank')}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                                        {newsItem.source || '뉴스'}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {getTimeAgo(newsItem.publishedAt)}
                                    </span>
                                </div>
                                <h3 className="text-foreground font-medium mb-1">{newsItem.headline}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">{newsItem.summary}</p>
                            </div>
                        )) : (
                            <div className="col-span-2 text-muted-foreground text-sm py-4 text-center">뉴스 데이터가 없습니다</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
