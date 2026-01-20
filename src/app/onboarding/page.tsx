"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userApi } from "@/lib/api/user";
import { SajuInfo } from "@/types/user";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { parseError } from "@/lib/api/error";

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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleNext = async () => {
        if (currentStep === "profile") {
            setFieldErrors({});
            if (!formData.nickname || !formData.birthDate || !formData.gender) {
                setError("필수 항목을 모두 입력해주세요.");
                return;
            }
            setCurrentStep("survey");
        } else if (currentStep === "survey") {
            setFieldErrors({});
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
                // 공통 에러 파서 사용
                const parsed = parseError(err);

                // 온보딩 전용 에러 코드(ONBOARDING_001~003)에 따라 UX를 분기한다.
                switch (parsed.code) {
                    case "ONBOARDING_001":
                        // 입력값 유효성 에러: 각 필드 옆에 구체 메시지를 표시한다.
                        setError(null);
                        setFieldErrors(parsed.fieldErrors || {
                            birthDate: "생년월일과 시간, 성별, 달력 유형 조합을 다시 확인해주세요.",
                        });
                        break;
                    case "ONBOARDING_002":
                        // 음력/윤달 변환 에러: 상단에 안내 문구를 표시한다.
                        setError("음력/윤달 변환 중 문제가 발생했습니다. 달력 종류와 생년월일을 다시 확인해주세요.");
                        break;
                    case "ONBOARDING_003":
                        // 일반 사주 계산 실패: 일시적인 오류 안내
                        setError("일시적인 오류입니다. 잠시 후 다시 시도해주세요.");
                        break;
                    default:
                        setError(parsed.message || "온보딩 처리 중 오류가 발생했습니다.");
                        break;
                }
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

            <div className="w-full max-w-[500px] min-h-[600px] p-10 flex flex-col relative z-10 glass-panel shadow-2xl rounded-3xl mb-20">
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
                                label="닉네임"
                                placeholder="투자도사"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                            {fieldErrors.nickname && (
                                <p className="mt-1 text-xs text-red-400">{fieldErrors.nickname}</p>
                            )}
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">생년월일</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                                {fieldErrors.birthDate && (
                                    <p className="mt-1 text-xs text-red-400">{fieldErrors.birthDate}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">태어난 시각</label>
                                <input
                                    type="time"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.birthTime}
                                    onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                                />
                                {fieldErrors.birthTime && (
                                    <p className="mt-1 text-xs text-red-400">{fieldErrors.birthTime}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">성별</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                                >
                                    <option value="MALE">남성</option>
                                    <option value="FEMALE">여성</option>
                                </select>
                                {fieldErrors.gender && (
                                    <p className="mt-1 text-xs text-red-400">{fieldErrors.gender}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">음양력 선택</label>
                                <select
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-[var(--accent-purple)] focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] icon-invert"
                                    value={formData.calendarType}
                                    onChange={(e) => setFormData({ ...formData, calendarType: e.target.value as "SOLAR" | "LUNAR" | "LUNAR_LEAP" })}
                                >
                                    <option value="SOLAR">양력</option>
                                    <option value="LUNAR">음력</option>
                                    <option value="LUNAR_LEAP">윤달</option>
                                </select>
                                {fieldErrors.calendarType && (
                                    <p className="mt-1 text-xs text-red-400">{fieldErrors.calendarType}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!formData.nickname || !formData.birthDate || !formData.gender}
                            className="relative w-full h-12 mt-6 rounded-xl bg-[linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,215,0,0.05))] backdrop-blur-md border border-[rgba(255,215,0,0.35)] text-[#B8860B] font-semibold tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.2)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:border-[#B8860B] hover:text-[#B8860B] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step
                        </button>
                    </div>
                )}

                {/* Step 2: Investment Style Survey */}
                {currentStep === "survey" && (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-14">
                            <h1 className="text-3xl font-bold mb-2 text-white font-heading">Investment Style</h1>
                            <p className="text-gray-400 text-sm font-body">
                                평소 당신의 투자 성향은 어떤가요?
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
                            {["안전 제일! 예적금이 최고야 🛡️", "적당한 수익, 적당한 위험 ⚖️", "인생은 한방! 고위험 고수익 🔥"].map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border flex items-center gap-6 cursor-pointer transition-all ${formData.investmentStyle === option
                                        ? "bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }`}
                                    onClick={() => setFormData({ ...formData, investmentStyle: option })}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 relative flex items-center justify-center transition-colors ${formData.investmentStyle === option ? "border-white" : "border-gray-500"
                                        }`}>
                                        {formData.investmentStyle === option && (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                        )}
                                    </div>
                                    <span className={`transition-colors ${formData.investmentStyle === option ? "text-white font-bold" : "text-gray-400"
                                        }`}>{option}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <Button variant="secondary" onClick={handleBack} className="flex-1 h-12 rounded-xl">
                                Back
                            </Button>
                            <button
                                onClick={handleNext}
                                disabled={!formData.investmentStyle || isLoading}
                                className="relative flex-1 h-12 rounded-xl bg-[linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,215,0,0.05))] backdrop-blur-md border border-[rgba(255,215,0,0.35)] text-[#B8860B] font-semibold tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.2)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:border-[#B8860B] hover:text-[#B8860B] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Analyzing..." : "Analyze Fate"}
                            </button>
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
                            <div className="text-9xl mb-6">
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

                        <button
                            onClick={() => router.push("/")}
                            className="relative w-full h-12 mt-6 rounded-xl bg-[linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,215,0,0.05))] backdrop-blur-md border border-[rgba(255,215,0,0.35)] text-[#B8860B] font-semibold tracking-wide shadow-[0_0_25px_rgba(255,215,0,0.2)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:border-[#B8860B] hover:text-[#B8860B] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Enter Dashboard 🚀
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
