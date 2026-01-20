"use client";

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { gameApi } from '@/lib/api/game';
import { RankingResponse } from '@/types/api';

export default function RankingPage() {
    const { profile, items, isRankingJoined } = useUserStore();
    const [ranking, setRanking] = useState<RankingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadRanking();
    }, []);

    const loadRanking = async () => {
        setIsLoading(true);
        try {
            const data = await gameApi.getRanking();
            setRanking(data);
        } catch (error) {
            console.error('Failed to load ranking:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Top 3 랭커 (API에서 가져온 데이터)
    const topRankers = ranking?.items.slice(0, 3) || [];

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-background" suppressHydrationWarning>
            {/* Header */}
            <div className="px-4 pt-4 shrink-0 text-left">
                <h1 className="text-2xl font-bold text-foreground">🏆 수익률 랭킹 🏆</h1>
                <p className="text-muted-foreground text-sm">이번 달 최고의 투자자들을 만나보세요</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 pb-20 no-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-muted-foreground">랭킹을 불러오는 중...</div>
                    </div>
                ) : !ranking || ranking.items.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-muted-foreground">랭킹 데이터가 없습니다</div>
                    </div>
                ) : (
                    <>

                {/* Podium */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex justify-center items-end gap-4 mt-8">
                        {/* 2nd Place */}
                        {topRankers.length > 1 && (
                            <div className="flex flex-col items-center z-10">
                                <div className="relative mb-2">
                                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl border-2 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.5)]">
                                        {topRankers[1].avatarUrl ? (
                                            <img src={topRankers[1].avatarUrl} alt={topRankers[1].nickname} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span>🧑‍💼</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">
                                        2
                                    </div>
                                </div>
                                <p className="text-foreground font-bold text-sm shadow-black drop-shadow-md">{topRankers[1]?.nickname || '-'}</p>
                                <p className="text-muted-foreground text-xs mb-1">총 자산 ${(topRankers[1]?.totalEquity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                {topRankers[1]?.returnPercent !== undefined && (
                                    <p className="text-green-400 text-sm font-medium">↗ {topRankers[1].returnPercent >= 0 ? '+' : ''}{topRankers[1].returnPercent.toFixed(2)}%</p>
                                )}

                            {/* Podium Block */}
                            <div className="relative w-24 h-28 mt-2 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-gray-600 rounded-t-lg opacity-80"></div>
                                {/* LED Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-gray-400/20 to-transparent rounded-t-lg"></div>
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-gray-300 shadow-[0_0_10px_rgba(209,213,219,0.8)]"></div>
                                <div className="absolute inset-0 shadow-[0_0_30px_rgba(107,114,128,0.4)_inset]"></div>

                                <span className="relative text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">2</span>
                            </div>
                        </div>
                        )}

                        {/* 1st Place */}
                        {topRankers.length > 0 && (
                            <div className="flex flex-col items-center -mt-8 z-20">
                                <div className="text-yellow-400 text-2xl mb-1 animate-bounce">👑</div>
                                <div className="relative mb-2">
                                    <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center text-3xl border-4 border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                                        {topRankers[0].avatarUrl ? (
                                            <img src={topRankers[0].avatarUrl} alt={topRankers[0].nickname} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span>👑</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-foreground font-bold text-lg shadow-black drop-shadow-md">{topRankers[0]?.nickname || '-'}</p>
                                <p className="text-muted-foreground text-xs mb-1">총 자산 ${(topRankers[0]?.totalEquity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                {topRankers[0]?.returnPercent !== undefined && (
                                    <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full mb-1">
                                        <p className="text-green-400 text-sm font-bold">↗ {topRankers[0].returnPercent >= 0 ? '+' : ''}{topRankers[0].returnPercent.toFixed(2)}%</p>
                                    </div>
                                )}

                            {/* Podium Block */}
                            <div className="relative w-28 h-40 mt-2 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-yellow-900 to-yellow-600 rounded-t-lg opacity-90"></div>
                                {/* LED Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/30 to-transparent rounded-t-lg"></div>
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-yellow-200 shadow-[0_0_15px_rgba(253,224,71,1)]"></div>
                                <div className="absolute inset-0 shadow-[0_0_50px_rgba(234,179,8,0.5)_inset]"></div>
                                {/* Side Glows */}
                                <div className="absolute inset-y-0 -left-4 w-4 bg-gradient-to-r from-transparent to-yellow-500/20 blur-md"></div>
                                <div className="absolute inset-y-0 -right-4 w-4 bg-gradient-to-l from-transparent to-yellow-500/20 blur-md"></div>

                                <span className="relative text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]">1</span>
                            </div>
                        </div>
                        )}

                        {/* 3rd Place */}
                        {topRankers.length > 2 && (
                            <div className="flex flex-col items-center z-10">
                                <div className="relative mb-2">
                                    <div className="w-16 h-16 bg-orange-800 rounded-full flex items-center justify-center text-2xl border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                                        {topRankers[2].avatarUrl ? (
                                            <img src={topRankers[2].avatarUrl} alt={topRankers[2].nickname} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span>🔥</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">
                                        3
                                    </div>
                                </div>
                                <p className="text-foreground font-bold text-sm shadow-black drop-shadow-md">{topRankers[2]?.nickname || '-'}</p>
                                <p className="text-muted-foreground text-xs mb-1">총 자산 ${(topRankers[2]?.totalEquity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                {topRankers[2]?.returnPercent !== undefined && (
                                    <p className="text-green-400 text-sm font-medium">↗ {topRankers[2].returnPercent >= 0 ? '+' : ''}{topRankers[2].returnPercent.toFixed(2)}%</p>
                                )}

                            {/* Podium Block */}
                            <div className="relative w-24 h-20 mt-2 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-lg opacity-80"></div>
                                {/* LED Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-orange-400/20 to-transparent rounded-t-lg"></div>
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-orange-300 shadow-[0_0_10px_rgba(253,186,116,0.8)]"></div>
                                <div className="absolute inset-0 shadow-[0_0_30px_rgba(249,115,22,0.4)_inset]"></div>

                                <span className="relative text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">3</span>
                            </div>
                            </div>
                        )}
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* Sticky "My Ranking" Footer */}
            {isRankingJoined && ranking?.my && (
                <div className="shrink-0 p-4 border-t border-purple-500/30 bg-card relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-purple-900/10 dark:bg-purple-900/10"></div>
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>

                    <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            {/* My Rank */}
                            <div className="w-12 h-12 rounded-full border-2 border-purple-500 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-white font-bold text-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                {ranking.my.rank}
                            </div>

                            {/* My Avatar & Name */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    {profile?.profileImage ? (
                                        <img src={profile.profileImage} alt="Me" className="w-full h-full rounded-full border border-border object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full border border-border bg-secondary flex items-center justify-center">👤</div>
                                    )}
                                    {items.find(i => i.equipped) && (
                                        <div className="absolute -top-3 -right-2 text-xl drop-shadow filter">👑</div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-foreground font-bold">{profile?.nickname || '사용자'}</p>
                                        <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">ME</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">총 자산 ${(ranking.my?.totalEquity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>

                        {/* My Stats */}
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-muted-foreground text-xs">수익률</p>
                                {ranking.my?.returnPercent !== undefined && (
                                    <p className={`font-bold font-mono ${ranking.my.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {ranking.my.returnPercent >= 0 ? '+' : ''}{ranking.my.returnPercent.toFixed(2)}%
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground text-xs">보유 아이템</p>
                                <p className="text-foreground font-bold">{items.length}개</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
