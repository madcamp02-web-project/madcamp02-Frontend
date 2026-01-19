"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";

// Backend URL for Option A (Redirection)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LoginPage() {
    const router = useRouter();
    const { login, loginAsGuest, error: authError } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState("user@example.com");
    const [password, setPassword] = useState("123456");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login({ email, password });
            router.push('/'); // Redirect to dashboard on success
        } catch (err) {
            console.error("Login Error", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKakaoLogin = () => {
        // Option A: Redirect to Backend OAuth Endpoint
        window.location.href = `${BACKEND_URL}/oauth2/authorization/kakao`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden p-4 bg-[#0F0F12]">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,rgba(10,10,12,0)_70%)] -z-10 pointer-events-none" />

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
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors">
                        <Image src="/google.svg" alt="Google" width={20} height={20} />
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={handleKakaoLogin}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] text-black font-medium rounded-xl hover:bg-[#FDD835] transition-colors"
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
    );
}
