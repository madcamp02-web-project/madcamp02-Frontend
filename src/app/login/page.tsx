"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useAuthStore } from "@/stores/auth-store";
import { hasCompletedOnboarding } from "@/lib/utils";

// Backend URL for Option A (Redirection)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Kakao 및 Google SDK 타입 선언
declare global {
    interface Window {
        Kakao?: {
            init: (key: string) => void;
            isInitialized: () => boolean;
            Auth: {
                login: (options: {
                    success: (authObj: { access_token: string }) => void;
                    fail: (err: any) => void;
                }) => void;
            };
        };
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const router = useRouter();
    const { login, loginAsGuest, error: authError } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log('[LoginPage] 로그인 시도:', { email });
            await login({ email, password });
            console.log('[LoginPage] 로그인 성공, 리다이렉트');
            router.push('/'); // Redirect to dashboard on success
        } catch (err: any) {
            console.error("[LoginPage] Login Error:", err);
            // 에러는 auth-store에서 이미 설정되므로 UI에 표시됨
            // 추가 에러 처리가 필요하면 여기서 처리
        } finally {
            setIsLoading(false);
        }
    };

    // Option A: Backend-Driven (Redirect 방식)
    const handleKakaoLoginRedirect = () => {
        window.location.href = `${BACKEND_URL}/oauth2/authorization/kakao`;
    };

    // Kakao SDK 초기화
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
            const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
            if (kakaoKey) {
                window.Kakao.init(kakaoKey);
            }
        }
    }, []);

    // Option B: Frontend-Driven (SDK 방식 - Kakao)
    const handleKakaoLoginSDK = async () => {
        setIsLoading(true);
        try {
            if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
                window.Kakao.Auth.login({
                    success: async (authObj) => {
                        try {
                            const { loginWithKakao } = useAuthStore.getState();
                            const isNewUser = await loginWithKakao(authObj.access_token);

                            // 온보딩 필요 여부는 isNewUser + 프로필 상태를 함께 사용
                            const state = useAuthStore.getState();
                            const needOnboarding = isNewUser || !hasCompletedOnboarding(state.user);

                            router.push(needOnboarding ? '/onboarding' : '/');
                        } catch (err) {
                            console.error('Kakao login error:', err);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    fail: (err) => {
                        console.error('Kakao login failed:', err);
                        setIsLoading(false);
                    },
                });
            } else {
                // SDK가 없으면 Redirect 방식으로 fallback
                handleKakaoLoginRedirect();
            }
        } catch (err) {
            console.error('Kakao SDK error:', err);
            setIsLoading(false);
        }
    };

    // Google Login (Frontend-Driven)
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            
            if (!googleClientId) {
                console.error('Google Client ID not configured');
                // SDK가 없으면 Backend Redirect 방식
                window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
                return;
            }

            // Google SDK가 로드될 때까지 대기
            const waitForGoogleSDK = () => {
                return new Promise<void>((resolve, reject) => {
                    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
                        resolve();
                        return;
                    }
                    
                    let attempts = 0;
                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
                            clearInterval(checkInterval);
                            resolve();
                        } else if (attempts > 20) { // 2초 대기 (100ms * 20)
                            clearInterval(checkInterval);
                            reject(new Error('Google SDK failed to load'));
                        }
                    }, 100);
                });
            };

            try {
                await waitForGoogleSDK();
                
                window.google!.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: async (response) => {
                        try {
                            const { loginWithGoogle } = useAuthStore.getState();
                            const isNewUser = await loginWithGoogle(response.credential);

                            // 온보딩 필요 여부는 isNewUser + 프로필 상태를 함께 사용
                            const state = useAuthStore.getState();
                            const needOnboarding = isNewUser || !hasCompletedOnboarding(state.user);

                            router.push(needOnboarding ? '/onboarding' : '/');
                        } catch (err) {
                            console.error('Google login error:', err);
                            setIsLoading(false);
                        }
                    },
                });
                
                // 직접 로그인 트리거
                window.google!.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // 팝업이 표시되지 않으면 Backend Redirect 방식으로 fallback
                        window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
                        setIsLoading(false);
                    }
                });
            } catch (err) {
                console.error('Google SDK not available, using backend redirect:', err);
                // SDK가 없으면 Backend Redirect 방식
                window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Google login error:', err);
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Kakao SDK 로드 */}
            <Script
                src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
                strategy="lazyOnload"
                onLoad={() => {
                    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
                    if (kakaoKey && typeof window !== 'undefined' && window.Kakao) {
                        window.Kakao.init(kakaoKey);
                    }
                }}
            />
            {/* Google Sign-In SDK 로드 */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('Google SDK loaded');
                }}
                onError={() => {
                    console.error('Google SDK failed to load');
                }}
            />

            <div className="flex items-center justify-center min-h-screen relative overflow-hidden p-4 bg-[#0F0F12]" suppressHydrationWarning>
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,rgba(10,10,12,0)_70%)] -z-10 pointer-events-none" suppressHydrationWarning />

            <div className="w-full max-w-[420px] p-10 rounded-2xl flex flex-col gap-8 shadow-2xl bg-[#16161d] border border-white/10">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                        Stock&Fortune
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Begin your fortune journey.
                    </p>
                </div>

                {/* Form */}
                <form className="flex flex-col gap-4" onSubmit={handleEmailLogin}>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent-purple)] transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="oracle@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--accent-purple)] transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {authError && (
                        <p className="text-red-500 text-sm">{authError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[var(--accent-purple)] text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center text-gray-600 text-xs font-semibold before:content-[''] before:flex-1 before:h-px before:bg-white/10 after:content-[''] after:flex-1 after:h-px after:bg-white/10">
                    <span className="px-4">OR CONTINUE WITH</span>
                </div>

                {/* Guest Login (Dev Mode) */}
                <button
                    type="button"
                    onClick={async () => {
                        await loginAsGuest();
                        router.push('/');
                    }}
                    className="w-full py-2.5 mb-3 bg-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/10"
                >
                    Guest Login (Dev Mode)
                </button>

                {/* Social Login */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Image src="/google.svg" alt="Google" width={20} height={20} />
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={handleKakaoLoginSDK}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] text-black font-medium rounded-xl hover:bg-[#FDD835] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Image src="/kakao.svg" alt="Kakao" width={20} height={20} />
                        Kakao
                    </button>
                </div>

                {/* Footer Toggle */}
                <div className="text-center text-sm text-gray-400 mt-4">
                    <p>
                        Don't have an account?
                        <Link
                            href="/signup"
                            className="bg-transparent border-none text-cyan-400 font-semibold cursor-pointer ml-2 hover:text-white hover:underline transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
            </div>
        </>
    );
}
