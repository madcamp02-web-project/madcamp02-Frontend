"use client";

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';
import { gameApi, ItemCategory } from '@/lib/api/game';
import { GachaResponse } from '@/types/api';
import GachaResultModal from '@/components/shop/GachaResultModal';

const GACHA_PRICE = 100; // 문서 기준 100 코인 고정

const rarityColors: Record<string, string> = {
    COMMON: "bg-gray-500",
    RARE: "bg-blue-500",
    EPIC: "bg-purple-500",
    LEGENDARY: "bg-yellow-500",
};

const rarityLabels: Record<string, string> = {
    COMMON: "Common",
    RARE: "Rare",
    EPIC: "Epic",
    LEGENDARY: "Legendary",
};

// 확률 정보 (API에서 제공하지 않을 수 있으므로 상수로 유지)
const probabilities = [
    { rarity: "Common", color: "bg-gray-400", percent: 60 },
    { rarity: "Rare", color: "bg-blue-400", percent: 25 },
    { rarity: "Epic", color: "bg-purple-400", percent: 12 },
    { rarity: "Legendary", color: "bg-yellow-400", percent: 3 },
];

// 테마별 색상 설정
const themeConfigs = {
    name: {
        color: "text-yellow-400",
        borderColor: "border-yellow-500",
        bgGlow: "from-yellow-500/20",
        shadow: "shadow-yellow-500/50",
        btnBg: "bg-yellow-500",
        gradientStart: "#EAB308",
        gradientEnd: "#CA8A04",
    },
    avatar: {
        color: "text-blue-400",
        borderColor: "border-blue-500",
        bgGlow: "from-blue-500/20",
        shadow: "shadow-blue-500/50",
        btnBg: "bg-blue-500",
        gradientStart: "#3B82F6",
        gradientEnd: "#2563EB",
    },
    theme: {
        color: "text-purple-400",
        borderColor: "border-purple-500",
        bgGlow: "from-purple-500/20",
        shadow: "shadow-purple-500/50",
        btnBg: "bg-purple-500",
        gradientStart: "#A855F7",
        gradientEnd: "#9333EA",
    }
};

export default function ShopPage() {
    const [activeTab, setActiveTab] = useState<ItemCategory>('NAMEPLATE');
    const [isSpinning, setIsSpinning] = useState(false);
    const [gachaResult, setGachaResult] = useState<GachaResponse | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [items, setItems] = useState<{ [key in ItemCategory]?: any[] }>({});
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const { wallet, fetchWallet } = useUserStore();

    // 초기 로드
    useEffect(() => {
        fetchWallet().catch(() => {});
        loadItems();
    }, [fetchWallet]);

    // 탭 변경 시 아이템 로드
    useEffect(() => {
        loadItems();
    }, [activeTab]);

    const loadItems = async () => {
        setIsLoadingItems(true);
        try {
            const response = await gameApi.getItems(activeTab);
            setItems(prev => ({ ...prev, [activeTab]: response.items }));
        } catch (error) {
            console.error('Failed to load items:', error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const activeTheme = themeConfigs[activeTab === 'NAMEPLATE' ? 'name' : activeTab === 'AVATAR' ? 'avatar' : 'theme'];
    const coins = wallet?.coin || 0;
    const currentItems = items[activeTab] || [];

    const handleGacha = async () => {
        if (coins < GACHA_PRICE || isSpinning) return;

        setIsSpinning(true);
        try {
            const result = await gameApi.gacha(activeTab);
            setGachaResult(result);
            setShowResultModal(true);
            // 지갑 정보 재조회
            await fetchWallet();
        } catch (error: any) {
            const errorCode = error.response?.data?.error;
            if (errorCode === 'GAME_001') {
                alert('코인이 부족합니다.');
            } else if (errorCode === 'GAME_002') {
                alert('재추첨에 실패했습니다. 모든 아이템이 중복입니다.');
            } else if (errorCode === 'GAME_003') {
                alert('가챠 대상 아이템이 없습니다.');
            } else {
                alert('가챠 실행 중 오류가 발생했습니다.');
            }
        } finally {
            setIsSpinning(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden" suppressHydrationWarning>
            {/* Header */}
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">운명 캡슐 토이</h1>
                        <p className="text-muted-foreground text-sm">레버를 돌려 희귀 아이템을 뽑아보세요!</p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2 shadow-sm">
                        <span className="text-yellow-400 animate-pulse">✨</span>
                        <span className="text-foreground font-bold">{coins.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm">코인</span>
                    </div>
                </div>
            </div>

            {/* Tabs (LED Style) */}
            <div className="px-4 pt-4">
                <div className="flex gap-4">
                    {[
                        { key: 'NAMEPLATE' as ItemCategory, label: '이름 꾸미기', glowColor: 'shadow-yellow-500/50', activeBorder: 'border-yellow-500', themeKey: 'name' as const },
                        { key: 'AVATAR' as ItemCategory, label: '아바타 꾸미기', glowColor: 'shadow-blue-500/50', activeBorder: 'border-blue-500', themeKey: 'avatar' as const },
                        { key: 'THEME' as ItemCategory, label: '테마 꾸미기', glowColor: 'shadow-purple-500/50', activeBorder: 'border-purple-500', themeKey: 'theme' as const },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative flex-1 py-3 rounded-xl font-medium text-sm transition-all overflow-hidden group border ${activeTab === tab.key
                                ? `${tab.activeBorder} bg-secondary`
                                : 'border-border bg-card hover:bg-secondary/50'
                                }`}
                        >
                            {/* Active Tab LED Glow */}
                            {activeTab === tab.key && (
                                <>
                                    <div className={`absolute inset-0 bg-${tab.themeKey === 'name' ? 'yellow' : tab.themeKey === 'avatar' ? 'blue' : 'purple'}-500/10`}></div>
                                    <div className={`absolute bottom-0 inset-x-0 h-[2px] bg-${tab.themeKey === 'name' ? 'yellow' : tab.themeKey === 'avatar' ? 'blue' : 'purple'}-400 shadow-[0_0_10px_rgba(255,255,255,0.8)]`}></div>
                                    <div className={`absolute inset-0 shadow-[0_0_20px_rgba(255,255,255,0.2)_inset]`}></div>
                                </>
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className={activeTab === tab.key ? 'text-foreground font-bold drop-shadow-md' : 'text-muted-foreground'}>{tab.label}</div>
                                <div className={`text-xs ${activeTab === tab.key ? themeConfigs[tab.themeKey].color : 'text-muted-foreground'}`}>
                                    {GACHA_PRICE} 코인
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 flex gap-4">
                {/* Gacha Machine */}
                <div className={`relative flex-[2] bg-card border ${activeTheme.borderColor}/30 rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500`}>
                    {/* Machine LED Background Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeTheme.bgGlow} to-transparent opacity-30`}></div>
                    <div className={`absolute inset-0 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)_inset]`}></div>

                    {/* Capsule Machine */}
                    <div className="relative z-10">
                        {/* Top dome (glass part with capsules) */}
                        <div className={`relative w-64 h-48 bg-gradient-to-b from-white/20 to-transparent dark:from-white/10 rounded-t-[100px] border-2 border-gray-200 dark:border-white/20 overflow-hidden shadow-xl dark:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
                            {/* Glass reflection */}
                            <div className="absolute top-4 left-4 w-12 h-24 bg-white/20 rounded-full blur-md transform -rotate-12 z-20"></div>

                            {/* Inner Glow based on Theme */}
                            <div className={`absolute inset-0 bg-${activeTab === 'name' ? 'yellow' : activeTab === 'avatar' ? 'blue' : 'purple'}-500/20 dark:bg-${activeTab === 'name' ? 'yellow' : activeTab === 'avatar' ? 'blue' : 'purple'}-500/10 z-0`}></div>

                            {/* Capsules inside */}
                            <div className="absolute inset-4 flex flex-wrap justify-center items-center gap-1 p-4 z-10">
                                {[...Array(18)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`relative w-8 h-8 rounded-full shadow-lg ${isSpinning ? 'animate-bounce' : ''}`}
                                        style={{
                                            background: `linear-gradient(135deg, ${activeTheme.gradientStart} 50%, ${activeTheme.gradientEnd} 50%)`,
                                            animationDelay: `${i * 30}ms`,
                                            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Glossy highlight */}
                                        <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-[1px]"></div>
                                        <div className="absolute top-0.5 left-2 w-1 h-1 bg-white/40 rounded-full blur-[0.5px]"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Sparkle */}
                            <div className={`absolute top-2 right-4 ${activeTheme.color} text-lg animate-pulse`}>✨</div>
                        </div>

                        {/* Machine body */}
                        <div className="w-64 bg-secondary border-2 border-gray-200 dark:border-white/20 border-t-0 rounded-b-2xl p-4 shadow-xl relative">
                            {/* Side LED Lines */}
                            <div className={`absolute top-0 bottom-4 left-2 w-0.5 bg-${activeTab === 'name' ? 'yellow' : activeTab === 'avatar' ? 'blue' : 'purple'}-500/50 shadow-[0_0_5px_currentColor]`}></div>
                            <div className={`absolute top-0 bottom-4 right-2 w-0.5 bg-${activeTab === 'name' ? 'yellow' : activeTab === 'avatar' ? 'blue' : 'purple'}-500/50 shadow-[0_0_5px_currentColor]`}></div>

                            {/* Control panel */}
                            <div className="flex items-center justify-between mb-3 px-2">
                                {/* Coin slot */}
                                <div className="flex items-center gap-2 bg-black/40 rounded-full px-2 py-1 border border-white/10">
                                    <div className="w-1 h-4 bg-black rounded-full border border-white/20"></div>
                                    <span className={`${activeTheme.color} font-bold text-sm`}>{GACHA_PRICE}</span>
                                </div>

                                {/* Lever */}
                                <div className="relative group cursor-pointer" onClick={handleGacha}>
                                    <div className={`w-3 h-10 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full transition-transform duration-300 origin-bottom ${isSpinning ? 'rotate-45' : 'group-hover:rotate-12'}`}>
                                        <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 ${activeTheme.btnBg} rounded-full border-2 border-white/50 dark:shadow-[0_0_10px_currentColor]`}></div>
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-gray-700 rounded-full"></div>
                                </div>
                            </div>

                            {/* Output slot */}
                            <div className="bg-black/80 rounded-xl h-12 flex items-center justify-center border border-white/10 shadow-inner">
                                <div className={`w-full h-full flex items-center justify-center ${isSpinning ? 'animate-pulse' : ''}`}>
                                    <span className="text-gray-500 text-[10px] tracking-widest">OUTPUT</span>
                                </div>
                            </div>
                        </div>

                        {/* Base */}
                        <div className="w-72 h-4 bg-[#2A2A35] rounded-b-xl mx-auto -mt-1 shadow-2xl"></div>
                    </div>

                    {/* Machine Label */}
                    <div className="text-center mt-6 mb-2 relative">
                        <h3 className={`font-black text-2xl tracking-widest ${activeTheme.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}>FORTUNE</h3>
                        <h3 className={`font-black text-xl tracking-[0.5em] text-muted-foreground/50`}>GACHA</h3>
                    </div>

                    {/* Pull Button */}
                    <button
                        onClick={handleGacha}
                        disabled={coins < GACHA_PRICE || isSpinning}
                        className={`mt-4 px-16 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 ${coins >= GACHA_PRICE && !isSpinning
                            ? `${activeTheme.btnBg} text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:brightness-110`
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5'
                            }`}
                    >
                        {isSpinning ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⌛</span> 뽑는 중...
                            </span>
                        ) : (
                            `PULL!`
                        )}
                    </button>
                </div>

                {/* Right Panel */}
                <div className="flex-[1] flex flex-col gap-4">
                    {/* Available Items */}
                    <div className={`bg-card border ${activeTheme.borderColor}/30 rounded-2xl p-4 transition-colors duration-500`}>
                        <h3 className="text-foreground font-bold text-sm mb-3 flex items-center gap-2">
                            <span className={activeTheme.color}>✨</span> 획득 가능 아이템
                        </h3>
                        <div className="space-y-2">
                            {isLoadingItems ? (
                                <div className="text-center text-muted-foreground py-4 text-sm">로딩 중...</div>
                            ) : currentItems.length > 0 ? currentItems.map((item) => (
                                <div key={item.itemId} className="flex items-center gap-3 bg-secondary rounded-lg p-2 border border-border hover:border-muted-foreground/30 transition-colors">
                                    <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center text-xl shadow-inner">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span>🎁</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-foreground text-sm font-medium">{item.name}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${rarityColors[item.rarity]} text-white shadow-sm`}>
                                            {rarityLabels[item.rarity]}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-4 text-sm">아이템이 없습니다</div>
                            )}
                        </div>
                    </div>

                    {/* Probability */}
                    <div className={`bg-card border ${activeTheme.borderColor}/30 rounded-2xl p-4 transition-colors duration-500`}>
                        <h3 className="text-foreground font-bold text-sm mb-3">확률 정보</h3>
                        <div className="space-y-2">
                            {probabilities.map((prob) => (
                                <div key={prob.rarity} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${prob.color} shadow-[0_0_5px_currentColor]`}></div>
                                        <span className="text-muted-foreground text-sm font-medium">{prob.rarity}</span>
                                    </div>
                                    <span className="text-muted-foreground text-sm">{prob.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gacha Result Modal */}
            {showResultModal && gachaResult && (
                <GachaResultModal
                    result={gachaResult}
                    onClose={() => {
                        setShowResultModal(false);
                        setGachaResult(null);
                    }}
                />
            )}
        </div>
    );
}
