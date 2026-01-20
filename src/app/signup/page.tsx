"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function SignupPage() {
    const router = useRouter();
    const { signup, isLoading, error } = useAuthStore();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        nickname: "",
    });
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        // Validation
        if (!formData.email || !formData.password || !formData.nickname) {
            setLocalError("모든 필드를 입력해주세요.");
            return;
        }

        if (formData.password.length < 6) {
            setLocalError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }

        try {
            await signup(formData);
            setIsSuccess(true);
            // Redirect to login after short delay
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (err) {
            // Error is already handled by auth-store
            console.error("Signup failed:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4" suppressHydrationWarning>
            <div className="w-full max-w-md bg-[#16161d] p-8 rounded-2xl border border-white/10 shadow-xl">
                <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-[var(--accent-gold)] to-orange-500 bg-clip-text text-transparent">
                    회원가입
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(localError || error) && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
                            {localError || error}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-xl text-center">
                            회원가입 성공! 로그인 페이지로 이동합니다...
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">이메일</label>
                        <input
                            type="email"
                            className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--accent-gold)] outline-none transition-colors"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
                        <input
                            type="password"
                            className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--accent-gold)] outline-none transition-colors"
                            placeholder="********"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">닉네임</label>
                        <input
                            type="text"
                            className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-3 focus:border-[var(--accent-gold)] outline-none transition-colors"
                            placeholder="투자도사"
                            value={formData.nickname}
                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isSuccess}
                        className="w-full py-3 mt-4 bg-[var(--accent-gold)] text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                가입 처리중...
                            </>
                        ) : (
                            "가입하기"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    이미 계정이 있으신가요?{" "}
                    <Link href="/login" className="text-[var(--accent-gold)] hover:underline">
                        로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
