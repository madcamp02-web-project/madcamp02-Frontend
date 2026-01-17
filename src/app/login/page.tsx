"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { authenticate } from "@/lib/actions";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden p-4">
            {/* Background Decor (Gradients) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,rgba(10,10,12,0)_70%)] -z-10 pointer-events-none" />

            <div className="w-full max-w-[420px] p-10 rounded-2xl flex flex-col gap-8 shadow-2xl glass-panel">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                        Stock&Fortune
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Welcome back, Investor." : "Begin your fortune journey."}
                    </p>
                </div>

                {/* Form */}
                <form className="flex flex-col" action={dispatch}>
                    {!isLogin && (
                        <Input label="Nickname" name="name" placeholder="Enter your nickname" />
                    )}
                    <Input label="Email" name="email" type="email" placeholder="oracle@example.com" defaultValue="user@example.com" />
                    <Input label="Password" name="password" type="password" placeholder="••••••••" defaultValue="123456" />
                    {!isLogin && (
                        <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" />
                    )}

                    {errorMessage && (
                        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                    )}

                    <Button type="submit" variant="primary" className="mt-4">
                        {isLogin ? "Sign In" : "Create Account"}
                    </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center text-gray-600 text-xs font-semibold before:content-[''] before:flex-1 before:h-px before:bg-white/10 after:content-[''] after:flex-1 after:h-px after:bg-white/10">
                    <span className="px-4">OR CONTINUE WITH</span>
                </div>

                {/* Social Login */}
                <div className="flex gap-3">
                    <Button variant="google">
                        <Image src="/google.svg" alt="Google" width={20} height={20} />
                        Google
                    </Button>
                    <Button variant="kakao">
                        <Image src="/kakao.svg" alt="Kakao" width={20} height={20} />
                        Kakao
                    </Button>
                </div>

                {/* Footer Toggle */}
                <div className="text-center text-sm text-gray-400 mt-4">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            className="bg-transparent border-none text-cyan-400 font-semibold cursor-pointer ml-2 hover:text-white hover:underline transition-colors"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
