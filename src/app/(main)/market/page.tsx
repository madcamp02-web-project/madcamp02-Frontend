"use client";

import React, { useState } from 'react';

// Mock Data - Market Indices
const marketIndices = [
    { name: "KOSPI", value: "2,567.89", change: "+19.34", changePercent: "+0.61%", isPositive: true },
    { name: "KOSDAQ", value: "845.23", change: "-3.21", changePercent: "-0.38%", isPositive: false },
    { name: "NASDAQ", value: "15,234.67", change: "+124.56", changePercent: "+0.82%", isPositive: true },
    { name: "S&P 500", value: "4,789.34", change: "+28.91", changePercent: "+0.61%", isPositive: true },
];

// Mock Data - Rising Stocks
const risingStocks = [
    { rank: 1, name: "미래테크", code: "123456", price: 45600, changePercent: "+12.87%" },
    { rank: 2, name: "바이오제약", code: "234567", price: 78900, changePercent: "+11.45%" },
    { rank: 3, name: "전기차부품", code: "345678", price: 123000, changePercent: "+10.81%" },
    { rank: 4, name: "반도체소재", code: "456789", price: 56700, changePercent: "+10.53%" },
    { rank: 5, name: "AI솔루션", code: "567890", price: 34500, changePercent: "+10.22%" },
];

// Mock Data - Falling Stocks
const fallingStocks = [
    { rank: 1, name: "건설중공업", code: "678901", price: 23400, changePercent: "-13.33%" },
    { rank: 2, name: "철강산업", code: "789012", price: 45600, changePercent: "-11.45%" },
    { rank: 3, name: "조선해양", code: "890123", price: 67800, changePercent: "-9.60%" },
    { rank: 4, name: "에너지화학", code: "901234", price: 89000, changePercent: "-8.72%" },
    { rank: 5, name: "유통물류", code: "012345", price: 34500, changePercent: "-8.00%" },
];

// Mock Data - Top Volume
const topVolumeStocks = [
    { rank: 1, name: "삼성전자", volume: "35.2M", price: 71500, changePercent: "+2.14%" },
    { rank: 2, name: "SK하이닉스", volume: "22.1M", price: 132000, changePercent: "-1.49%" },
    { rank: 3, name: "현대차", volume: "21.3M", price: 198000, changePercent: "-0.75%" },
    { rank: 4, name: "NAVER", volume: "18.5M", price: 185000, changePercent: "+0.93%" },
    { rank: 5, name: "LG화학", volume: "15.9M", price: 420000, changePercent: "+1.84%" },
];

// Mock Data - News
const newsItems = [
    { category: "주식", timeAgo: "5분 전", title: "삼성전자, 차세대 반도체 공정 개발 성공", desc: "3나노 공정 기술로 글로벌 시장 선도 예상, 생산성 30% 향상" },
    { category: "경제", timeAgo: "15분 전", title: "AI 열풍에 빅테크 기업들 투자 확대", desc: "데이터센터와 칩 관련 IT 기업투자 AI 시장 급성장" },
    { category: "주식", timeAgo: "25분 전", title: "SK하이닉스, HBM3E 양산 시작", desc: "고대역폭 메모리 시장에서 경쟁 우위 확보 전망" },
    { category: "글로벌", timeAgo: "32분 전", title: "미 연준, 금리 동결 결정", desc: "인플레이션 둔화에도 불구하고 신중한 접근 유지" },
    { category: "주식", timeAgo: "45분 전", title: "현대차, 전기차 라인업 확대", desc: "2024년 신규 EV 5개 모델 출시 예정" },
    { category: "경제", timeAgo: "1시간 전", title: "원/달러 환율 1,300원대 진입", desc: "수출기업에 유리한 환경 조성, 수입물가 상승 우려" },
    { category: "주식", timeAgo: "1시간 전", title: "네이버, 클라우드 사업 성장세 지속", desc: "기업용 AI 솔루션 수요 증가로 실적 개선 기대" },
    { category: "글로벌", timeAgo: "2시간 전", title: "유가 배럴당 80달러 돌파", desc: "중동 긴장 고조로 에너지 가격 상승세" },
];

export default function MarketNewsPage() {
    const [newsTab, setNewsTab] = useState<'all' | 'stock' | 'economy'>('all');

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
                <h1 className="text-2xl font-bold text-foreground">시장 현황</h1>
                <p className="text-muted-foreground text-sm">실시간 시장 동향 및 뉴스</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4">
                {/* Market Indices */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {marketIndices.map((index) => (
                        <div key={index.name} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-muted-foreground text-sm">{index.name}</span>
                                <span className={`text-xs ${index.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    ↗ {index.changePercent}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">{index.value}</div>
                            <div className={`text-sm ${index.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {index.change}
                            </div>
                        </div>
                    ))}
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
                            {risingStocks.map((stock) => (
                                <div key={stock.code} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-xs font-bold">
                                            {stock.rank}
                                        </span>
                                        <div>
                                            <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                            <div className="text-muted-foreground text-xs">{stock.code}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                        <div className="text-red-500 text-xs font-medium">{stock.changePercent}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Falling Stocks */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-red-400">📉</span>
                            <h2 className="text-foreground font-bold">급락 종목</h2>
                        </div>
                        <div className="space-y-2">
                            {fallingStocks.map((stock) => (
                                <div key={stock.code} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xs font-bold">
                                            {stock.rank}
                                        </span>
                                        <div>
                                            <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                            <div className="text-muted-foreground text-xs">{stock.code}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                        <div className="text-blue-500 text-xs font-medium">{stock.changePercent}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Volume */}
                    <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400">⚡</span>
                            <h2 className="text-foreground font-bold">거래량 상위</h2>
                        </div>
                        <div className="space-y-2">
                            {topVolumeStocks.map((stock, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold">
                                            {stock.rank}
                                        </span>
                                        <div>
                                            <div className="text-foreground font-medium text-sm">{stock.name}</div>
                                            <div className="text-muted-foreground text-xs">{stock.volume}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-foreground font-medium text-sm">{stock.price.toLocaleString()}</div>
                                        <div className={`text-xs font-medium ${stock.changePercent.startsWith('+') ? 'text-red-500' : 'text-blue-500'}`}>
                                            {stock.changePercent}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                        {newsItems.map((news, idx) => (
                            <div key={idx} className="bg-secondary border border-border rounded-xl p-4 hover:border-muted-foreground/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                                        {news.category}
                                    </span>
                                    <span className="text-muted-foreground text-xs">{news.timeAgo}</span>
                                </div>
                                <h3 className="text-foreground font-medium mb-1">{news.title}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">{news.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
