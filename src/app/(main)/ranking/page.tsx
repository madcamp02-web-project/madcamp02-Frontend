"use client";

import React from 'react';
import { useUserStore } from '@/store/user-store';

// Top 3 랭커 데이터 (Mock)
const topRankers = [
    { rank: 2, name: "차트마스터", profit: "+128.45%", items: 2, avatar: "🧑‍💼", color: "bg-gray-400" },
    { rank: 1, name: "황금손", profit: "+156.32%", items: 2, avatar: "👑", color: "bg-yellow-500" },
    { rank: 3, name: "위험한초보니야", profit: "+98.21%", items: 2, avatar: "🔥", color: "bg-orange-500" },
];

// 대회 및 업적 데이터
const events = [
    { icon: "🏆", title: "주간 대회", desc: "매주 월요일 시작", time: "남은 시간: 2일 14시간", reward: "1위: 10,000 코인" },
    { icon: "🥇", title: "월간 대회", desc: "매월 1일 시작", time: "남은 시간: 14일 08시간", reward: "1위: 50,000 코인" },
];

const achievements = [
    { name: "첫 거래", progress: "완료", completed: true },
    { name: "연속 10일 접속", progress: "진행중 7/10", completed: false },
];

export default function RankingPage() {
    const { profile, items, stats, isRankingJoined } = useUserStore();

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-[#0F0F12]">
            {/* Header */}
            <div className="text-center py-4 border-b border-white/5 shrink-0">
                <h1 className="text-2xl font-bold text-white">🏆 수익률 랭킹 🏆</h1>
                <p className="text-gray-500 text-sm">이번 달 최고의 투자자들을 만나보세요</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 pb-20 no-scrollbar">
                {/* Event Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 주간 대회 (Gold) */}
                    <div className="relative bg-[#0F0F12] border border-yellow-500/30 rounded-2xl p-4 overflow-hidden group">
                        {/* LED Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_20px_rgba(234,179,8,0.1)_inset]"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-yellow-400 text-lg drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">{events[0].icon}</span>
                                <h3 className="text-white font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">{events[0].title}</h3>
                            </div>
                            <p className="text-gray-400 text-xs mb-2">{events[0].desc}</p>
                            <p className="text-yellow-200/80 text-xs mb-2">⏰ {events[0].time}</p>
                            <div className="border-t border-yellow-500/20 pt-2">
                                <p className="text-gray-400 text-xs">보상</p>
                                <p className="text-yellow-400 text-sm font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">✨ {events[0].reward}</p>
                            </div>
                        </div>
                    </div>

                    {/* 월간 대회 (Purple) */}
                    <div className="relative bg-[#0F0F12] border border-purple-500/30 rounded-2xl p-4 overflow-hidden group">
                        {/* LED Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_20px_rgba(168,85,247,0.1)_inset]"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-purple-400 text-lg drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">{events[1].icon}</span>
                                <h3 className="text-white font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">{events[1].title}</h3>
                            </div>
                            <p className="text-gray-400 text-xs mb-2">{events[1].desc}</p>
                            <p className="text-purple-200/80 text-xs mb-2">⏰ {events[1].time}</p>
                            <div className="border-t border-purple-500/20 pt-2">
                                <p className="text-gray-400 text-xs">보상</p>
                                <p className="text-purple-400 text-sm font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">🎁 {events[1].reward}</p>
                            </div>
                        </div>
                    </div>

                    {/* 달성 업적 (Green) */}
                    <div className="relative bg-[#0F0F12] border border-green-500/30 rounded-2xl p-4 overflow-hidden group">
                        {/* LED Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_20px_rgba(34,197,94,0.1)_inset]"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400 text-lg drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">🎖️</span>
                                <h3 className="text-white font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">달성 업적</h3>
                            </div>
                            <p className="text-gray-400 text-xs mb-3">특별 보상 획득</p>
                            <div className="space-y-2">
                                {achievements.map((ach, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">{ach.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${ach.completed
                                            ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.3)]'
                                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                            }`}>
                                            {ach.progress}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Podium */}
                <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-center items-end gap-4 mt-8">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center z-10">
                            <div className="relative mb-2">
                                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl border-2 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.5)]">
                                    {topRankers[0].avatar}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">
                                    2
                                </div>
                            </div>
                            <p className="text-white font-bold text-sm shadow-black drop-shadow-md">{topRankers[0].name}</p>
                            <p className="text-gray-400 text-xs mb-1">{topRankers[0].items}개 아이템 장착</p>
                            <p className="text-green-400 text-sm font-medium">↗ {topRankers[0].profit}</p>

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

                        {/* 1st Place */}
                        <div className="flex flex-col items-center -mt-8 z-20">
                            <div className="text-yellow-400 text-2xl mb-1 animate-bounce">👑</div>
                            <div className="relative mb-2">
                                <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center text-3xl border-4 border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                                    {topRankers[1].avatar}
                                </div>
                            </div>
                            <p className="text-white font-bold text-lg shadow-black drop-shadow-md">{topRankers[1].name}</p>
                            <p className="text-gray-400 text-xs mb-1">{topRankers[1].items}개 아이템 장착</p>
                            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full mb-1">
                                <p className="text-green-400 text-sm font-bold">↗ {topRankers[1].profit}</p>
                            </div>

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

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center z-10">
                            <div className="relative mb-2">
                                <div className="w-16 h-16 bg-orange-800 rounded-full flex items-center justify-center text-2xl border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                                    {topRankers[2].avatar}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">
                                    3
                                </div>
                            </div>
                            <p className="text-white font-bold text-sm shadow-black drop-shadow-md">{topRankers[2].name}</p>
                            <p className="text-gray-400 text-xs mb-1">{topRankers[2].items}개 아이템 장착</p>
                            <p className="text-green-400 text-sm font-medium">↗ {topRankers[2].profit}</p>

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
                    </div>
                </div>
            </div>

            {/* Sticky "My Ranking" Footer */}
            {isRankingJoined && (
                <div className="shrink-0 p-4 border-t border-purple-500/30 bg-[#16161d] relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-purple-900/10"></div>
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>

                    <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            {/* My Rank */}
                            <div className="w-12 h-12 rounded-full border-2 border-purple-500 flex items-center justify-center bg-purple-900/50 text-white font-bold text-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                                {stats.rank}
                            </div>

                            {/* My Avatar & Name */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    <img src={profile.avatar} alt="Me" className="w-full h-full rounded-full border border-white/20 object-cover" />
                                    {items.find(i => i.name === "황금 왕관" && i.isEquipped) && (
                                        <div className="absolute -top-3 -right-2 text-xl drop-shadow filter">👑</div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-bold">{profile.nickname}</p>
                                        <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">ME</span>
                                    </div>
                                    <p className="text-gray-400 text-xs">상위 5% • 전일 대비 ▲ 3위</p>
                                </div>
                            </div>
                        </div>

                        {/* My Stats */}
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">수익률</p>
                                <p className="text-green-400 font-bold font-mono">{stats.profit}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">보유 아이템</p>
                                <p className="text-white font-bold">{items.length}개</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
