"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { hasCompletedOnboarding } from "@/lib/utils";

export default function OAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        // URL 파라미터에서 토큰 추출
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const isNewUser = searchParams.get("isNewUser") === "true";
        const error = searchParams.get("error");

        // 에러 처리
        if (error) {
            console.error("OAuth error:", error);
            setTimeout(() => {
                router.push("/login?error=auth_failed");
            }, 2000);
            return;
        }

        // 토큰이 없는 경우
        if (!accessToken) {
            console.error("No token found in callback");
            setTimeout(() => {
                router.push("/login?error=no_token");
            }, 2000);
            return;
        }

        // 토큰을 localStorage에 저장
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        // auth-store 상태 업데이트 (토큰 설정)
        const authStore = useAuthStore.getState();
        useAuthStore.setState({
            token: accessToken,
            isAuthenticated: true,
            isLoading: true,
        });

        // 사용자 정보 가져오기 후 온보딩 완료 여부/신규 여부를 함께 판단
        authStore
            .checkAuth()
            .then(() => {
                const state = useAuthStore.getState();
                const needOnboarding = isNewUser || !hasCompletedOnboarding(state.user);
                router.push(needOnboarding ? "/onboarding" : "/");
            })
            .catch((err) => {
                console.error("Auth check failed:", err);
                // 토큰이 유효하지 않은 경우 정리
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                authStore.logout();
                router.push("/login?error=auth_check_failed");
            });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-[#0F0F12] flex flex-col items-center justify-center" suppressHydrationWarning>
            <div className="w-16 h-16 border-4 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mb-4" suppressHydrationWarning></div>
            <p className="text-white text-lg font-medium" suppressHydrationWarning>로그인 처리 중...</p>
        </div>
    );
}
