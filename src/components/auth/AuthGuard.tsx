"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { hasCompletedOnboarding } from "@/lib/utils";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, checkAuth, token, user } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    // 1차: 마운트 시 항상 토큰 기반 인증 상태 확인
    useEffect(() => {
        console.log("AUTH GUARD: Mounted. Calling checkAuth...");
        setMounted(true);
        checkAuth();
    }, [checkAuth]);

    // 2차: 인증 여부에 따른 /login 리다이렉트
    useEffect(() => {
        console.log("AUTH GUARD: State - mounted:", mounted, "isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
        if (mounted && !isLoading && !isAuthenticated) {
            console.log("AUTH GUARD: Redirecting to /login");
            router.replace("/login");
        }
    }, [mounted, isLoading, isAuthenticated, router]);

    // 3차: 온보딩 미완료 사용자는 메인 레이아웃에서 항상 /onboarding으로 강제
    useEffect(() => {
        if (!mounted || isLoading) return;
        if (!isAuthenticated) return;

        const needOnboarding = !hasCompletedOnboarding(user);
        // 이 가드는 (main) 레이아웃 안에서만 쓰이므로, 여기서는 메인 경로만 보호하면 된다.
        if (needOnboarding && pathname !== "/onboarding") {
            console.log("AUTH GUARD: Redirecting to /onboarding (onboarding not completed)");
            router.replace("/onboarding");
        }
    }, [mounted, isLoading, isAuthenticated, user, pathname, router]);

    // Prevent hydration mismatch by returning null until mounted
    if (!mounted) {
        return null;
    }

    // Show loading if we are verifying a token
    if (!mounted || isLoading) {
        console.log("AUTH GUARD: Loading...");
        return (
            <div className="h-full w-full flex items-center justify-center bg-background" suppressHydrationWarning>
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" suppressHydrationWarning></div>
            </div>
        );
    }

    // If no token at all, return null (redirecting)
    if (!isAuthenticated && !token && typeof window !== "undefined" && !localStorage.getItem("accessToken")) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
