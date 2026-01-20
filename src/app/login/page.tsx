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
    const { login, loginAsGuest, checkAuth, error: authError } = useAuthStore();
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
            console.log('[LoginPage] 로그인 성공, /api/v1/auth/me 조회로 온보딩 상태 확인');

            // 로그인 성공 후 /api/v1/auth/me를 통해 최신 사용자 정보를 가져온다.
            try {
                await checkAuth();
            } catch (checkError) {
                console.warn('[LoginPage] checkAuth 실패, 토큰은 존재할 수 있으므로 일단 메인으로 이동:', checkError);
            }

            // 최신 스토어 상태에서 온보딩 완료 여부를 다시 평가한다.
            const state = useAuthStore.getState();
            const needOnboarding = !hasCompletedOnboarding(state.user);

            console.log('[LoginPage] 온보딩 필요 여부:', { needOnboarding });
            router.push(needOnboarding ? '/onboarding' : '/');
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

            <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center p-4 relative overflow-hidden" suppressHydrationWarning>
                {/* Global Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(124,58,237,0.05)_0%,rgba(10,10,12,0)_70%)] -z-10 pointer-events-none" />

                <div className="w-full max-w-[1920px] grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-8 lg:px-24 relative z-10 lg:translate-x-10">

                    {/* Left Panel - Branding/Logo Area */}
                    <div className="w-full flex flex-col items-center justify-center text-center lg:translate-x-10 lg:-translate-y-20">
                        <div className="relative w-[320px] h-[320px] lg:w-[700px] lg:h-[700px] animate-fade-in duration-700">
                            {/* Rotating Gold Spell Aura */}
                            {/* Magic Circle SVG */}
                            <svg
                                className="absolute inset-0 w-full h-full animate-spin-pause opacity-60 scale-90"
                                viewBox="0 0 400 400"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFE9A6" />
                                        <stop offset="50%" stopColor="#FFD36A" />
                                        <stop offset="100%" stopColor="#B8922E" />
                                    </linearGradient>

                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Outer Circle */}
                                <circle cx="200" cy="200" r="155"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="2"
                                    filter="url(#glow)"
                                />

                                {/* Rune Circle */}
                                <circle cx="200" cy="200" r="140"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 10"
                                    opacity="0.8"
                                />

                                {/* Inner Circle */}
                                <circle cx="200" cy="200" r="130"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="1.2"
                                    opacity="0.9"
                                />

                                {/* Hexagram */}
                                <polygon
                                    points="200,60 321,270 79,270"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="1.5"
                                />

                                <polygon
                                    points="200,340 321,130 79,130"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="1.5"
                                />

                                {/* Center Circle */}
                                <circle cx="200" cy="200" r="45"
                                    fill="none"
                                    stroke="url(#gold)"
                                    strokeWidth="1.5"
                                />

                                {/* Rune Dots */}
                                <g fill="#FFD36A">
                                    {/* Cardinal Dots (between Outer and Rune): r = 150 */}
                                    <circle cx="200" cy="50" r="3" />
                                    <circle cx="350" cy="200" r="3" />
                                    <circle cx="200" cy="350" r="3" />
                                    <circle cx="50" cy="200" r="3" />

                                    {/* Diagonal Dots (on Rune circle): r = 140 */}
                                    <circle cx="299" cy="101" r="2.5" />
                                    <circle cx="101" cy="299" r="2.5" />
                                    <circle cx="101" cy="101" r="2.5" />
                                    <circle cx="299" cy="299" r="2.5" />
                                </g>
                            </svg>
                            <Image
                                src="/jusulsa-logo.png"
                                alt="Jusulsa Logo"
                                fill
                                className="object-contain rounded-full drop-shadow-[0_0_55px_rgba(234,179,8,0.5)] relative z-10"
                                priority
                            />
                        </div>
                        <div className="animate-slide-up -mt-10 lg:-mt-25 relative z-20">
                            <p className="text-gray-400 text-xl lg:text-lg font-base tracking-wide ">
                                주식이 술술 풀리는 사람들
                            </p>
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="w-full lg:w-[420px] lg:ml-20 relative animate-fade-in-up delay-200">
                        {/* Card Background Decor */}
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-3xl -z-10 blur-2xl opacity-40" />

                        <div className="w-full p-8 rounded-3xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#121216]/90 border border-[#D4AF37]/20 backdrop-blur-xl ring-1 ring-white/5">
                            {/* Header */}
                            <div className="text-center mb-2">
                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#B8860B] to-[#996515]">
                                    Welcome Back
                                </h1>
                                <p className="text-gray-500 text-sm font-medium mt-1">주술사의 세계로 오신 것을 환영합니다</p>
                            </div>

                            {/* Form */}
                            <form className="flex flex-col gap-5" onSubmit={handleEmailLogin}>
                                <div>
                                    <label className="block text-sm text-[#D4AF37]/80 mb-1.5 ml-1 font-medium tracking-wide">이메일</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            className="w-full bg-[#0a0a0c] border border-[#D4AF37]/20 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-light group-hover:border-[#D4AF37]/40 placeholder:tracking-wider"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="jusulsa@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#D4AF37]/80 mb-1.5 ml-1 font-medium tracking-wide">비밀번호</label>
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            className="w-full bg-[#0a0a0c] border border-[#D4AF37]/20 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-light group-hover:border-[#D4AF37]/40 placeholder:tracking-wider"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {authError && (
                                    <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-pulse">{authError}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative w-full h-12 mt-6 rounded-xl bg-[linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,215,0,0.05))] backdrop-blur-md border border-[rgba(255,215,0,0.35)] text-[#B8860B] font-semibold tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.2)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:border-[#B8860B] hover:text-[#B8860B] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "로그인 중..." : "로그인하기"}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center text-gray-600 text-[10px] font-bold tracking-wider my-1 before:content-[''] before:flex-1 before:h-px before:bg-white/10 after:content-[''] after:flex-1 after:h-px after:bg-white/10">
                                <span className="px-4">OR</span>
                            </div>

                            {/* Guest Login (Dev Mode) */}
                            <button
                                type="button"
                                onClick={async () => {
                                    await loginAsGuest();
                                    router.push('/');
                                }}
                                className="w-full py-2.5 bg-white/5 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors border border-white/5 text-sm hover:text-white"
                            >
                                게스트 로그인
                            </button>

                            {/* Social Login */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                                >
                                    <Image src="/google.svg" alt="Google" width={18} height={18} />
                                    Google
                                </button>
                                <button
                                    type="button"
                                    onClick={handleKakaoLoginSDK}
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] text-black font-medium rounded-xl hover:bg-[#FDD835] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                                >
                                    <Image src="/kakao.svg" alt="Kakao" width={18} height={18} />
                                    Kakao
                                </button>
                            </div>
                        </div>

                        {/* Footer Toggle */}
                        <div className="text-center text-xs text-gray-500 mt-6">
                            <p>
                                계정이 없으신가요?
                                <Link
                                    href="/signup"
                                    className="bg-transparent border-none text-amber-400 font-semibold cursor-pointer ml-2 hover:text-amber-300 hover:underline transition-colors"
                                >
                                    회원가입
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
