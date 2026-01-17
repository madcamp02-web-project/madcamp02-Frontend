"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { handleSignOut } from "@/lib/actions";

const menuItems = [
  { label: "대시보드", href: "/", icon: "📊" },
  { label: "거래", href: "/trade", icon: "📈" },
  { label: "포트폴리오", href: "/portfolio", icon: "💼" },
  { label: "시장/뉴스", href: "/market", icon: "📰" },
  { label: "AI 도사", href: "/oracle", icon: "🔮" },
  { label: "가챠 샵", href: "/shop", icon: "🎰" },
  { label: "랭킹", href: "/ranking", icon: "🏆" },
  { label: "마이페이지", href: "/mypage", icon: "👤" },
];

export default function Sidebar() {
  const { isSidebarOpen } = useUIStore();
  const pathname = usePathname();

  return (
    <aside className={`${isSidebarOpen ? 'w-[280px] p-6 border-l' : 'w-0 p-0 border-none min-w-0'} h-screen bg-[#0F0F12] border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap`}>
      <div className="flex items-center gap-3 mb-8 min-w-[200px]">
        <div className="text-2xl text-[var(--accent-gold)]">☀️</div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-base text-white">Stock-Persona</span>
          <span className="text-xs text-gray-500">투자 RPG 대시보드</span>
        </div>
      </div>

      <div className="mb-8 min-w-[200px]">
        <button className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          ☀️ 라이트 모드
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-1 min-w-[200px]">
        {menuItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 no-underline text-[15px] transition-all hover:bg-white/5 hover:text-white ${isActive
                  ? "bg-gradient-to-r from-yellow-500/20 to-transparent text-[var(--accent-gold)] border-l-[3px] border-[var(--accent-gold)]"
                  : ""
                }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 min-w-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-[var(--accent-gold)] rounded-full flex items-center justify-center text-lg">👑</div>
          <div className="flex flex-col">
            <div className="font-semibold text-white text-sm">황금손</div>
            <div className="text-xs text-[var(--accent-cyan)]">총 자산 2,600 💎</div>
          </div>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
