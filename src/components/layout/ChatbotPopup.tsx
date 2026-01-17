"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export default function ChatbotPopup() {
    const { isChatbotOpen, closeChatbot, isSidebarOpen } = useUIStore();
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
        { text: "안녕하세요. 나는 천년을 살아온 투자 도사라네.\n자네의 투자와 운세에 대해 무엇이든 물어보게나.", isUser: false }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatbotOpen]);

    // Handle outside click or escape
    // (Optional: depending on UX preference, maybe we want it to stay open)

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        // User message
        const newMessages = [...messages, { text: inputValue, isUser: true }];
        setMessages(newMessages);
        setInputValue("");

        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "허허, 투자는 마음의 평정심이 가장 중요하다네. 조금 더 신중하게 살펴보게나.",
                isUser: false
            }]);
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    if (!isChatbotOpen) return null;

    return (
        <div
            className="fixed bottom-24 w-[350px] bg-[#16161d] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] transition-all duration-300 ease-out"
            style={{ right: isSidebarOpen ? '320px' : '2rem' }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--accent-purple)] to-[#4f46e5] p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔮</span>
                    <h3 className="text-white font-bold text-sm">AI 도사 상담소</h3>
                </div>
                <button
                    onClick={closeChatbot}
                    className="text-white/70 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto h-[350px] bg-[#0F0F12] relative scrollbar-hide">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #7c3aed 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-center text-xs text-gray-500 my-2">오후 11:46</div>

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            {!msg.isUser && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm mr-2 shrink-0 border border-white/10 shadow-lg">
                                    🧙‍♂️
                                </div>
                            )}
                            <div
                                className={`max-w-[75%] px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow-md ${msg.isUser
                                        ? 'bg-[#4f46e5] text-white rounded-br-none border border-[#6366f1]'
                                        : 'bg-[#27272a] text-gray-200 rounded-bl-none border border-white/10'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#16161d] p-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 border-t border-white/10">
                <button className="flex-1 whitespace-nowrap px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors">
                    📜 오늘의 운세
                </button>
                <button className="flex-1 whitespace-nowrap px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-colors">
                    📈 추천 종목
                </button>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#16161d] border-t border-white/10 shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="도사에게 물어보세요..."
                        className="w-full bg-[#27272a] text-white text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] border border-white/10 placeholder-gray-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-[var(--accent-purple)] rounded-lg text-white hover:bg-[#6d28d9] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-2">
                    * AI 도사의 조언은 참고용이며, 실제 투자 판단은 본인의 책임입니다.
                </p>
            </div>
        </div>
    );
}
