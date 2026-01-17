"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { useUserStore } from '@/store/user-store';

export default function PersonaRanking() {
    const { profile, items, stats } = useUserStore();

    // Mock other rankings
    const rankings = [
        { rank: 1, name: "황금손", profit: "+156.32%", color: "bg-yellow-400" },
        { rank: 2, name: "차트마스터", profit: "+128.45%", color: "bg-gray-300" },
        { rank: 3, name: "위험한초보", profit: "+98.21%", color: "bg-orange-500" },
    ];

    return (
        <WidgetCard className="h-full bg-[#0F0F12]">
            <div className="flex flex-col h-full gap-4">
                {/* Top Section: Persona Card (Dynamic) */}
                <div className="bg-[radial-gradient(circle_at_center,#2d2d24_0%,#1a1a1a_100%)] border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group shrink-0">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0 w-20 h-20">
                            {/* Equipped Effects - Background (e.g. Aura) */}
                            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>

                            <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden border-2 border-[#121212]">
                                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Equipped Items (Visual) */}
                            {items.find(i => i.name === "황금 왕관" && i.isEquipped) && (
                                <div className="absolute -top-4 -right-2 text-3xl drop-shadow-lg filter rotate-12 z-20">
                                    👑
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col min-w-0">
                            <span className="text-yellow-400 font-bold text-lg whitespace-nowrap flex items-center gap-1">
                                {items.find(i => i.name === "반짝이 테두리" && i.isEquipped) ? "✨" : ""}
                                {profile.nickname}
                                {items.find(i => i.name === "반짝이 테두리" && i.isEquipped) ? "✨" : ""}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">Lv.99</span>
                                <span className="text-gray-400 text-xs">LEGENDARY INVESTOR</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">내 랭킹: <span className="text-white font-bold">{stats.rank}위</span> (상위 5%)</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Ranking List */}
                <div className="flex-1 overflow-auto flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-sm font-bold text-white">Top 랭킹</span>
                        <span className="text-xs text-yellow-500">🏆</span>
                    </div>
                    {rankings.map((user, idx) => (
                        <div
                            key={user.rank}
                            className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-lg text-xs shrink-0 ${user.color} ${user.rank > 3 ? '!text-white' : ''}`}>
                                {user.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-white truncate">{user.name}</div>
                                {user.rank === 1 && <span className="text-[10px] text-yellow-500 font-medium block">LEGEND</span>}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-bold text-green-400 text-sm">{user.profit}</div>
                            </div>
                        </div>
                    ))}

                    {/* My Rank Item (Always visible at bottom if not in top 3) */}
                    <div className="mt-auto border-t border-white/10 pt-2">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-yellow-500/20">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-gray-700 shadow-lg text-xs shrink-0 border border-yellow-500/50">
                                {stats.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-yellow-100 truncate flex items-center gap-1">
                                    {profile.nickname} <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1 rounded">나</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-bold text-green-400 text-sm">{stats.profit}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
}
