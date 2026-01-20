"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { handleSignOut } from "@/lib/actions";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className={`${isSidebarOpen ? 'w-[280px] p-6 border-r' : 'w-0 p-0 border-none min-w-0'} h-screen bg-card border-border flex flex-col shrink-0 transition-all duration-300 ease-out overflow-y-auto whitespace-nowrap`} suppressHydrationWarning>
      {/* 상단 고정 영역: 로고 */}
      <div className="flex flex-col items-center gap-3 mb-8 min-w-[200px] shrink-0">
        <Image
          src="/jusulsa-circle-logo.png"
          alt="주술사"
          width={500}
          height={500}
          className="object-contain rounded-full"
        />
        <span className="text-xs text-muted-foreground">주식이 술술 풀리는 사람들</span>
      </div>

      {/* 상단 고정 영역: 테마 토글 */}
      <div className="mb-8 min-w-[200px] shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full p-2 bg-secondary border border-border rounded-lg text-muted-foreground text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-muted transition-colors"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4" /> 라이트 모드
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" /> 다크 모드
            </>
          )}
        </button>
      </div>

      {/* 스크롤 가능한 메뉴 영역 */}
      <nav className="flex flex-col gap-2 flex-1 min-w-[200px] overflow-y-auto min-h-0">
        {menuItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground no-underline text-[15px] transition-all hover:bg-secondary hover:text-foreground shrink-0 ${isActive
                ? "bg-secondary text-accent border-l-[3px] border-accent"
                : ""
                }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 고정 영역: 로그아웃 */}
      <div className="mt-auto pt-6 border-t border-border min-w-[200px] shrink-0">
        <form action={handleSignOut}>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-lg text-destructive text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
