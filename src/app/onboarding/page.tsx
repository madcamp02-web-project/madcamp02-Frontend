"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userApi } from "@/lib/api/user";
import { SajuInfo } from "@/types/user";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

type OnboardingStep = "profile" | "survey" | "analyzing" | "result";

export default function OnboardingPage() {
    const router = useRouter();
    const { checkAuth } = useAuthStore();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");
    const [formData, setFormData] = useState({
        nickname: "",
        birthDate: "",
        birthTime: "",
        gender: "" as "MALE" | "FEMALE" | "OTHER" | "",
        calendarType: "SOLAR" as "SOLAR" | "LUNAR" | "LUNAR_LEAP",
        investmentStyle: "",
    });
    const [result, setResult] = useState<SajuInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNext = async () => {
        if (currentStep === "profile") {
            if (!formData.nickname || !formData.birthDate || !formData.gender) {
                setError("필수 항목을 모두 입력해주세요.");
                return;
            }
            setCurrentStep("survey");
        } else if (currentStep === "survey") {
            if (!formData.investmentStyle) {
                setError("투자 성향을 선택해주세요.");
                return;
            }
            setCurrentStep("analyzing");
            setError(null);
            setIsLoading(true);

            try {
                // API 호출
                const response = await userApi.submitOnboarding({
                    nickname: formData.nickname,
                    birthDate: formData.birthDate,
                    birthTime: formData.birthTime || undefined,
                    gender: formData.gender as "MALE" | "FEMALE" | "OTHER",
                    calendarType: formData.calendarType,
                });

                // 응답에서 사주 정보 추출
                if (response.saju) {
                    setResult(response.saju);
                } else {
                    // 응답 형식에 따라 조정 필요
                    setResult({
                        element: 'WOOD',
                        animal: '호랑이',
                        luck: '운명적 투자 성향 분석 완료',
                    });
                }

                // 온보딩으로 users.* 사주 필드가 갱신되었으므로, /user/me를 다시 조회해 전역 상태를 최신으로 맞춘다.
                try {
                    await checkAuth();
                } catch (refreshError) {
                    console.warn("[Onboarding] checkAuth after onboarding failed:", refreshError);
                }

                setTimeout(() => {
                    setCurrentStep("result");
                    setIsLoading(false);
                }, 1500);
            } catch (err: any) {
                setError(err.response?.data?.message || "온보딩 처리 중 오류가 발생했습니다.");
                setIsLoading(false);
                setCurrentStep("survey");
            }
        }
    };

    const handleBack = () => {
        if (currentStep === "survey") setCurrentStep("profile");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] relative overflow-hidden p-4" suppressHydrationWarning>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15)_0%,transparent_60%)] pointer-events-none z-0" />

            <div className="w-full max-w-[500px] min-h-[600px] p-10 flex flex-col relative z-10 glass-panel shadow-2xl rounded-3xl">
                {/* Progress Indicator */}
                {currentStep !== "analyzing" && currentStep !== "result" && (
                    <div className="flex justify-center gap-2 mb-8">
                        <div className={`h-2 rounded-full bg-white/20 transition-all duration-300 ${currentStep === "profile" ? "w-6 bg-[var(--accent-gold)]" : "w-2"}`} />
                        <div className={`h-2 rounded-full bg-white/20 transition-all duration-300 ${currentStep === "survey" ? "w-6 bg-[var(--accent-gold)]" : "w-2"}`} />
                    </div>
                )}

                {/* Step 1: User Profile (Saju Data) */}
                {currentStep === "profile" && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2 text-white font-heading">Who are you?</h1>
                            <p className="text-gray-400 text-sm font-body">
                                운명 분석을 위해 당신의 정보를 알려주세요.
                            </p>
                        </div>

                        <div className="flex flex-col gap-5 flex-1 mb-8">
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <Input
                                label="Nickname"
                                placeholder="투자도사"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Birth Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Birth Time (Optional)</label>
                                <input
                                    type="time"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.birthTime}
                                    onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Gender (필수)</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="MALE">남성</option>
                                    <option value="FEMALE">여성</option>
                                    <option value="OTHER">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Calendar Type (필수)</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.calendarType}
                                    onChange={(e) => setFormData({ ...formData, calendarType: e.target.value as "SOLAR" | "LUNAR" | "LUNAR_LEAP" })}
                                >
                                    <option value="SOLAR">양력</option>
                                    <option value="LUNAR">음력</option>
                                    <option value="LUNAR_LEAP">윤달</option>
                                </select>
                            </div>
                        </div>

                        <Button variant="primary" onClick={handleNext} disabled={!formData.nickname || !formData.birthDate || !formData.gender}>
                            Next Step
                        </Button>
                    </div>
                )}

                {/* Step 2: Investment Style Survey */}
                {currentStep === "survey" && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold mb-2 text-white font-heading">Investment Style</h1>
                            <p className="text-gray-400 text-sm font-body">
                                평소 당신의 투자 성향은 어떤가요?
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                            {["안전 제일! 예적금이 최고야 🛡️", "적당한 수익, 적당한 위험 ⚖️", "인생은 한방! 고위험 고수익 🔥"].map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${formData.investmentStyle === option
                                        ? "bg-[rgba(147,51,234,0.1)] border-[var(--accent-purple)]"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }`}
                                    onClick={() => setFormData({ ...formData, investmentStyle: option })}
                                >
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 relative flex items-center justify-center">
                                        {formData.investmentStyle === option && (
                                            <div className="w-2.5 h-2.5 bg-[var(--accent-purple)] rounded-full" />
                                        )}
                                    </div>
                                    <span className="text-white">{option}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <Button variant="secondary" onClick={handleBack}>
                                Back
                            </Button>
                            <Button variant="primary" onClick={handleNext} disabled={!formData.investmentStyle}>
                                Analyze Fate
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Analyzing Animation */}
                {currentStep === "analyzing" && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--accent-purple)] mb-6"></div>
                            <h2 className="text-2xl font-bold mb-2 text-white">Consulting the Stars...</h2>
                            <p className="text-gray-400 text-sm">당신의 사주의 기운을 읽고 있습니다...</p>
                        </div>
                    </div>
                )}

                {/* Step 4: Result */}
                {currentStep === "result" && result && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold mb-2 font-heading" style={{ color: "var(--accent-gold)" }}>
                                Analysis Complete!
                            </h1>
                            <p className="text-gray-400 text-sm font-body">당신의 운명적 투자 성향</p>
                        </div>

                        <div className="bg-[rgba(255,255,255,0.05)] p-6 rounded-2xl border border-[var(--accent-gold)] text-center mb-8">
                            <div className="text-4xl mb-4">
                                {result.element === 'FIRE' ? '🔥' :
                                    result.element === 'WATER' ? '💧' :
                                        result.element === 'WOOD' ? '🌳' :
                                            result.element === 'METAL' ? '⚔️' : '⛰️'}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {result.element} {result.animal}
                            </h2>
                            <p className="text-gray-300 text-sm mb-4">
                                {result.luck}
                            </p>
                            <div className="text-xs text-gray-500 bg-black/20 p-2 rounded">
                                추천: {result.element === 'FIRE' ? '성장주, 테크' : '배당주, 안정형'}
                            </div>
                        </div>

                        <Button variant="primary" onClick={() => router.push("/")}>
                            Enter Dashboard 🚀
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
