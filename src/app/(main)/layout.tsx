import Sidebar from "@/components/layout/Sidebar";
import ChatbotButton from "@/components/layout/ChatbotButton";
import ChatbotPopup from "@/components/layout/ChatbotPopup";
import HamburgerToggle from "@/components/layout/HamburgerToggle";
import HeaderProfile from "@/components/layout/HeaderProfile";
import AuthGuard from "@/components/auth/AuthGuard";
import Image from "next/image";
import Link from "next/link";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background" suppressHydrationWarning>
            <AuthGuard>
                <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300" suppressHydrationWarning>
                    {/* 좌상단 로고 */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ position: 'absolute', top: '0.5rem', left: '1.5rem', zIndex: 100 }}>
                        <Image
                            src="/jusulsa-text.png"
                            alt="주술사"
                            width={100}
                            height={36}
                            className="object-contain"
                        />
                        <span className="text-xs text-muted-foreground font-medium mt-4">주식이 술술 풀리는 사람들</span>
                    </Link>
                    {/* 우상단 프로필 + 햄버거 */}
                    <div className="flex items-center gap-3" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }} suppressHydrationWarning>
                        <HeaderProfile />
                        <HamburgerToggle />
                    </div>
                    <main className="flex-1 h-full overflow-hidden relative p-6 pt-16" suppressHydrationWarning>
                        {children}
                    </main>
                </div>
                <Sidebar />
                <ChatbotButton />
                <ChatbotPopup />
            </AuthGuard>
        </div>
    );
}
