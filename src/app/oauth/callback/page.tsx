"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function OAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useAuthStore(); // We need to expose setAuth or use a specific action

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        // const refreshToken = searchParams.get("refreshToken"); // If needed

        if (accessToken) {
            // Manually set auth state since we have the token
            localStorage.setItem("accessToken", accessToken);
            // We might need to call checkAuth to get user data
            useAuthStore.getState().checkAuth().then(() => {
                router.push("/");
            });
        } else {
            console.error("No token found");
            // router.push("/login?error=auth_failed");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-[#0F0F12] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-medium">로그인 처리 중...</p>
        </div>
    );
}
