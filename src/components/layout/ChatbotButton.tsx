"use client";

import { useUIStore } from "@/stores/ui-store";

export default function ChatbotButton() {
  const { isSidebarOpen, toggleChatbot } = useUIStore();

  return (
    <button
      onClick={toggleChatbot}
      className="fixed bottom-8 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[#4f46e5] border border-white/20 flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(124,58,237,0.4)] transition-all duration-300 ease-out z-50 p-0 group hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_6px_16px_rgba(124,58,237,0.6)]
      after:content-['AI_도사'] after:absolute after:-top-10 after:bg-black/80 after:px-3 after:py-1 after:rounded-md after:text-xs after:text-white after:opacity-0 after:transition-opacity after:pointer-events-none after:whitespace-nowrap hover:after:opacity-100"
      style={{ right: isSidebarOpen ? '312px' : '2rem' }}
      aria-label="AI Oracle Chatbot"
      suppressHydrationWarning
    >
      <span className="text-[1.75rem]">🔮</span>
    </button>
  );
}
