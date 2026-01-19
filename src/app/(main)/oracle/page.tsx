"use client";

import React, { useState } from 'react';

// Mock Data - 오행 밸런스
const fiveElementsBalance = [
    { element: "목(木)", icon: "🌳", percentage: 35, color: "#22C55E" },
    { element: "화(火)", icon: "🔥", percentage: 20, color: "#EF4444" },
    { element: "토(土)", icon: "🏔️", percentage: 18, color: "#A16207" },
    { element: "금(金)", icon: "⚪", percentage: 15, color: "#9CA3AF" },
    { element: "수(水)", icon: "💧", percentage: 12, color: "#3B82F6" },
];

export default function OraclePage() {
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', content: '안녕하시오. 나는 천년을 살아온 투자 도사라네. 🔮  자네의 투자와 운세에 대해 무엇이든 물어보게나.' }
    ]);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '오늘 당신의 사주를 보니, 목(木)의 기운이 강하군요. 기술주와 성장주에 좋은 기운이 있습니다. 다만 급한 결정은 피하시고, 신중하게 접근하세요! ✨'
            }]);
        }, 1000);
        setChatInput('');
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
                <h1 className="text-2xl font-bold text-foreground">AI 도사 상담소 🧙‍♂️</h1>
                <p className="text-muted-foreground text-sm">사주, 별자리, 오하아사로 당신의 투자 운을 확인하세요</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-4 flex gap-4">
                {/* Left: Chat Section - Gold Theme LED */}
                <div className="relative flex-[3] bg-card border border-yellow-500/30 rounded-2xl p-4 flex flex-col overflow-hidden group">
                    {/* LED Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)]"></div>
                    <div className="absolute inset-0 shadow-[0_0_30px_rgba(234,179,8,0.15)_inset] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src="/images/oracle_sage.png"
                                alt="천년 도사"
                                className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                            />
                            <div>
                                <h2 className="text-foreground font-bold text-lg drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">천년 도사와 대화하기</h2>
                                <p className="text-muted-foreground text-sm">AI가 당신의 운세를 분석해드립니다</p>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-auto space-y-3 mb-3 pr-2">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-[0_0_10px_rgba(0,0,0,0.2)] ${msg.role === 'user'
                                        ? 'bg-yellow-500 text-black font-medium shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                        : 'bg-secondary text-foreground border border-border'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="도사에게 질문하세요..."
                                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-foreground text-sm outline-none focus:border-yellow-500/50 focus:shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="px-4 py-2 bg-yellow-500 text-black font-bold text-sm rounded-xl hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)] hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all"
                            >
                                전송
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Fortune Cards (1 part) */}
                <div className="flex-[1.5] flex flex-col gap-3 overflow-auto pb-24">
                    {/* 사주 운세 - Green Theme LED */}
                    <div className="relative bg-card border border-green-500/30 rounded-2xl p-3 overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_15px_rgba(34,197,94,0.1)_inset] pointer-events-none"></div>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">🔮</span>
                                <h2 className="text-foreground font-bold text-sm drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]">
                                    임수(壬水) 일주의 오늘 운세
                                </h2>
                            </div>

                            {/* Today's Energy */}
                            <div className="bg-secondary rounded-lg p-3 mb-3 border border-border">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-green-400 text-xs font-bold">오늘의 기운</span>
                                    <span className="text-muted-foreground text-[10px]">수(水) - 지혜</span>
                                </div>
                                <p className="text-foreground text-xs leading-relaxed">
                                    "오늘은 물의 기운이 강하여 흐름을 타는 것이 좋습니다. 유연한 사고가 수익을 부릅니다."
                                </p>
                            </div>

                            {/* Key Fortune Items */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-secondary p-2 rounded border border-border text-center">
                                    <div className="text-muted-foreground text-[10px] mb-0.5">오늘의 육친</div>
                                    <div className="text-foreground text-xs font-bold">비견 (친구/동료)</div>
                                </div>
                                <div className="bg-secondary p-2 rounded border border-border text-center">
                                    <div className="text-muted-foreground text-[10px] mb-0.5">행운의 색</div>
                                    <div className="text-blue-400 text-xs font-bold">파랑 (Blue)</div>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="flex items-center justify-between mb-3 bg-secondary px-3 py-2 rounded border border-border">
                                <span className="text-muted-foreground text-xs">운세 점수</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <span key={i} className="text-xs text-yellow-400 shadow-[0_0_5px_rgba(234,179,8,0.5)]">★</span>
                                    ))}
                                    <span className="text-xs text-muted-foreground">★</span>
                                </div>
                            </div>

                            {/* Advice */}
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-green-400 text-xs mt-0.5">💡</span>
                                    <div>
                                        <p className="text-green-400 text-xs font-medium mb-1">오늘의 조언</p>
                                        <p className="text-foreground text-[11px] leading-relaxed opacity-90">
                                            "주변의 도움으로 막혔던 금전운이 풀리는 시기입니다. 오후 2시~6시에 귀인이 나타날 확률이 높습니다."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 별자리 운세 - Purple Theme LED */}
                    <div className="relative bg-card border border-purple-500/30 rounded-2xl p-3 overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_15px_rgba(168,85,247,0.1)_inset] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">⭐</span>
                                <h2 className="text-foreground font-bold text-sm drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">별자리 운세</h2>
                                <span className="text-purple-400 text-[10px] ml-auto">♒ 물병자리</span>
                            </div>
                            <div className="bg-secondary rounded p-2 mb-2 border border-border">
                                <h4 className="text-purple-400 text-[10px] font-medium mb-1 shadow-black">오늘의 금전운</h4>
                                <p className="text-muted-foreground text-xs leading-tight">새로운 투자 기회가 찾아올 수 있어요. 신중하게 분석 후 행동하세요.</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-[10px]">행운 지수</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <span key={i} className={`text-[10px] ${i <= 4 ? 'text-yellow-400 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'text-muted-foreground'}`}>★</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 오하아사 운세 - Red Theme LED */}
                    <div className="relative bg-card border border-red-500/30 rounded-2xl p-3 overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_15px_rgba(248,113,113,0.1)_inset] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">🌅</span>
                                <h2 className="text-foreground font-bold text-sm drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">오하아사</h2>
                                <span className="text-red-400 text-[10px] ml-auto">3위 / 12</span>
                            </div>
                            <div className="bg-secondary rounded p-2 mb-2 border border-border">
                                <h4 className="text-red-400 text-[10px] font-medium mb-1">오늘의 운세</h4>
                                <p className="text-muted-foreground text-xs leading-tight">직감을 믿으세요! 소액 투자로 시작해보는 것을 추천합니다.</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-muted-foreground text-[10px]">행운의 색</span>
                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                                <span className="text-blue-400 text-[10px]">파랑</span>
                            </div>
                        </div>
                    </div>

                    {/* 도사의 한마디 - Gold Theme LED */}
                    <div className="relative bg-card border border-yellow-500/30 rounded-2xl p-3 overflow-hidden group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                        <div className="absolute inset-0 shadow-[0_0_15px_rgba(234,179,8,0.1)_inset] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">✨</span>
                                <h2 className="text-foreground font-bold text-sm drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">도사의 한마디</h2>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-yellow-700 dark:text-yellow-200 text-xs leading-relaxed text-center italic drop-shadow-[0_0_2px_rgba(234,179,8,0.5)]">
                                    "시간은 돈이라 하지만, 시간대 또한 운명이니라.<br />
                                    오늘은 오후 2시부터 6시 사이에 큰 기회가 찾아올 것이니,<br />
                                    그때를 놓치지 말지어다."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
