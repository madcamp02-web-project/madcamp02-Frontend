import Sidebar from "@/components/layout/Sidebar";
import ChatbotButton from "@/components/layout/ChatbotButton";
import ChatbotPopup from "@/components/layout/ChatbotPopup";
import HamburgerToggle from "@/components/layout/HamburgerToggle";
import AuthGuard from "@/components/auth/AuthGuard";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background" suppressHydrationWarning>
            <AuthGuard>
                <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300" suppressHydrationWarning>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }} suppressHydrationWarning>
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
