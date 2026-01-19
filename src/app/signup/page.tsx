"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        nickname: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement API Integration
        console.log("Signup:", formData);
        alert("회원가입 기능은 API 연동 예정입니다.");
    };

    return (
        <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#16161d] p-8 rounded-2xl border border-white/10 shadow-xl">
                <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-[var(--accent-gold)] to-orange-500 bg-clip-text text-transparent">
                    회원가입
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        className="w-full py-3 mt-4 bg-[var(--accent-gold)] text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
                    >
                        가입하기
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
