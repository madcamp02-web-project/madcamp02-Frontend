"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading, checkAuth, token } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        console.log("AUTH GUARD: Mounted. Calling checkAuth...");
        setMounted(true);
        // Always run checkAuth
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        console.log("AUTH GUARD: State - mounted:", mounted, "isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
        if (mounted && !isLoading && !isAuthenticated) {
            console.log("AUTH GUARD: Redirecting to /login");
            router.replace('/login');
        }
    }, [mounted, isLoading, isAuthenticated, router]);

    // Prevent hydration mismatch by returning null until mounted
    if (!mounted) {
        return null;
    }

    // Show loading if we are verifying a token
    if (!mounted || isLoading) {
        console.log("AUTH GUARD: Loading...");
        return (
            <div className="h-full w-full flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If no token at all, return null (redirecting)
    if (!isAuthenticated && !token && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
