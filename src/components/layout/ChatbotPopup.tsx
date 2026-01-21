"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/stores/user-store";
import { useUIStore } from "@/stores/ui-store";
import { useChatStore } from "@/stores/chat-store";
import { sendMessageToAI } from "@/lib/api/ai";
import { useRouter } from "next/navigation";

export default function ChatbotPopup() {
    const { isChatbotOpen, closeChatbot, isSidebarOpen } = useUIStore();
    const { profile } = useUserStore();
    const router = useRouter();

    // Store
    const { messages, isLoading, addMessage, setLoading } = useChatStore();

    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatbotOpen, isLoading]);

    // Handle outside click or escape
    // (Optional: depending on UX preference, maybe we want it to stay open)

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue;

        // 1. User message
        addMessage({ text: userText, isUser: true });
        setInputValue("");
        setLoading(true);

        try {
            // 2. API Call - Inject Context if available
            let contextMessage = userText;
            if (profile?.birthDate) {
                const birthInfo = `${profile.birthDate} ${profile.birthTime || "00:00"}`;
                // Prepend context invisibly to the user
                contextMessage = `(컨텍스트 정보: 사용자 생년월일=${birthInfo}) ${userText}`;
            }

            const response = await sendMessageToAI(contextMessage);

            // 3. AI Response
            addMessage({ text: response, isUser: false });
        } catch (error) {
            addMessage({ text: "허허, 기가 약해져서 목소리가 안 들리는구먼. 다시 말해주게.", isUser: false });
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = async (type: "fortune" | "stock") => {
        if (isLoading) return;

        if (!profile?.birthDate) {
            addMessage({
                text: "허허, 자네의 사주를 알아야 운세를 봐줄 수 있지 않겠나? '마이페이지'에서 생년월일을 먼저 알려주게.",
                isUser: false
            });
            return;
        }

        const birthInfo = `${profile.birthDate} ${profile.birthTime || "00:00"}`;
        let prompt = "";
        let displayMessage = "";

        if (type === "fortune") {
            displayMessage = "오늘의 금전운을 봐줘";
            prompt = `내 생년월일은 ${birthInfo}야. 오늘 나의 금전운을 3줄 요약해서 알려줘.`;
        } else {
            displayMessage = "내 사주에 맞는 추천 종목을 알려줘";
            prompt = `내 생년월일은 ${birthInfo}야. 내 사주와 오행에 맞춰서 오늘 투자하면 좋을 주식 섹터나 업종을 3가지 정도 간단히 추천해줘.`;
        }

        addMessage({ text: displayMessage, isUser: true });
        setLoading(true);

        try {
            const response = await sendMessageToAI(prompt);
            addMessage({ text: response, isUser: false });
        } catch (error) {
            addMessage({ text: "허허, 기가 약해져서 목소리가 안 들리는구먼. 다시 말해주게.", isUser: false });
        } finally {
            setLoading(false);
        }
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isChatbotOpen) return null;

    return (
        <div
            className="fixed bottom-24 w-[350px] bg-[#16161d] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100] transition-all duration-300 ease-out"
            style={{ right: isSidebarOpen ? '320px' : '2rem' }}
            suppressHydrationWarning
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
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] bg-[#0F0F12] relative scrollbar-hide">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #7c3aed 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-center text-xs text-gray-500 my-2">오후 11:46</div>

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            {!msg.isUser && (
                                <img
                                    src="/images/oracle_sage.png"
                                    alt="도사"
                                    className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 border-2 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                                />
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

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <img
                                src="/images/oracle_sage.png"
                                alt="도사"
                                className="w-8 h-8 rounded-full object-cover mr-2 shrink-0 border-2 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                            />
                            <div className="bg-[#27272a] text-gray-200 px-3 py-2 rounded-xl rounded-bl-none border border-white/10 shadow-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#16161d] p-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 border-t border-white/10">
                <button
                    onClick={() => handleQuickAction("fortune")}
                    className="flex-1 whitespace-nowrap px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
                >
                    📜 오늘의 운세
                </button>
                <button
                    onClick={() => handleQuickAction("stock")}
                    className="flex-1 whitespace-nowrap px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                    📈 추천 종목
                </button>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#16161d] border-t border-white/10 shrink-0">
                <div className="relative flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="도사에게 물어보세요..."
                        rows={1}
                        className="w-full bg-[#27272a] text-white text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] border border-white/10 placeholder-gray-500 resize-none max-h-[100px] scrollbar-hide"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="absolute right-1.5 bottom-1.5 p-1.5 bg-[var(--accent-purple)] rounded-lg text-white hover:bg-[#6d28d9] transition-colors h-8 w-8 flex items-center justify-center"
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
