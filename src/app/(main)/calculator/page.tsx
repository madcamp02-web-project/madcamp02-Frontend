"use client";

import React, { useState } from "react";
import { calcApi, CalcDividendResponse, CalcTaxResponse } from "@/lib/api/calc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Tab = "dividend" | "tax";

export default function CalculatorPage() {
    const [activeTab, setActiveTab] = useState<Tab>("dividend");

    // 배당 탭 상태
    const [dividendYieldPercent, setDividendYieldPercent] = useState<string>("");
    const [dividendPerShare, setDividendPerShare] = useState<string>("");
    const [dividendTaxRatePercent, setDividendTaxRatePercent] = useState<string>("");
    const [dividendResult, setDividendResult] = useState<CalcDividendResponse | null>(null);
    const [isDividendLoading, setIsDividendLoading] = useState(false);
    const [dividendError, setDividendError] = useState<string | null>(null);

    // 세금 탭 상태
    const [taxRatePercent, setTaxRatePercent] = useState<string>("");
    const [taxResult, setTaxResult] = useState<CalcTaxResponse | null>(null);
    const [isTaxLoading, setIsTaxLoading] = useState(false);
    const [taxError, setTaxError] = useState<string | null>(null);

    // 탭 전환 시 입력값은 유지한다.

    const parsePercent = (value: string): number | undefined => {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const num = Number(trimmed.replace(",", ""));
        if (Number.isNaN(num)) return undefined;
        return num / 100;
    };

    const parseNumber = (value: string): number | undefined => {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const num = Number(trimmed.replace(",", ""));
        if (Number.isNaN(num)) return undefined;
        return num;
    };

    const handleCalculateDividend = async () => {
        setDividendError(null);
        setDividendResult(null);

        const assumedDividendYield = parsePercent(dividendYieldPercent);
        const dividendPerShareNum = parseNumber(dividendPerShare);
        const taxRate = parsePercent(dividendTaxRatePercent);

        if (assumedDividendYield === undefined && dividendPerShareNum === undefined) {
            setDividendError("배당 수익률(%) 또는 주당 배당액 중 하나 이상을 입력해주세요.");
            return;
        }

        setIsDividendLoading(true);
        try {
            const data = await calcApi.getDividend({
                assumedDividendYield,
                dividendPerShare: dividendPerShareNum,
                taxRate,
            });
            setDividendResult(data);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "배당 계산 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
            setDividendError(message);
        } finally {
            setIsDividendLoading(false);
        }
    };

    const handleCalculateTax = async () => {
        setTaxError(null);
        setTaxResult(null);

        const taxRate = parsePercent(taxRatePercent);
        if (taxRate === undefined) {
            setTaxError("세율(%)을 입력해주세요.");
            return;
        }

        setIsTaxLoading(true);
        try {
            const data = await calcApi.getTax({ taxRate });
            setTaxResult(data);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "세금 계산 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
            setTaxError(message);
        } finally {
            setIsTaxLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 text-foreground" suppressHydrationWarning>
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">💰 투자 계산기</h1>
                <p className="text-sm text-muted-foreground">
                    보유 자산과 실현 손익을 기반으로 예상 배당금과 세금을 가볍게 시뮬레이션해 보세요.
                </p>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-6 border-b border-border">
                <button
                    type="button"
                    onClick={() => setActiveTab("dividend")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === "dividend"
                            ? "border-[var(--accent-gold)] text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    배당 계산
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("tax")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === "tax"
                            ? "border-[var(--accent-gold)] text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    세금 계산
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 overflow-auto">
                {/* 입력 영역 */}
                <div className="col-span-5 bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                    {activeTab === "dividend" ? (
                        <>
                            <h2 className="text-base font-semibold mb-1">배당 계산</h2>
                            <p className="text-xs text-muted-foreground mb-2">
                                보유 자산과 가정 배당 수익률을 기준으로 예상 배당금·세후 수령액을 계산합니다. (통화는 현재 USD 기준)
                            </p>

                            {dividendError && (
                                <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs px-3 py-2 rounded-lg">
                                    {dividendError}
                                </div>
                            )}

                            <Input
                                label="배당 수익률 (%)"
                                placeholder="예: 3"
                                type="number"
                                value={dividendYieldPercent}
                                onChange={(e) => setDividendYieldPercent(e.target.value)}
                            />
                            <Input
                                label="주당 배당액 (선택)"
                                placeholder="예: 1.25"
                                type="number"
                                value={dividendPerShare}
                                onChange={(e) => setDividendPerShare(e.target.value)}
                            />
                            <Input
                                label="세율 (%) (선택)"
                                placeholder="예: 15.4"
                                type="number"
                                value={dividendTaxRatePercent}
                                onChange={(e) => setDividendTaxRatePercent(e.target.value)}
                            />

                            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                • 배당 수익률(%)은 총 자산 대비 연간 배당금 비율입니다. 예: 3 → 3%<br />
                                • 세율(%)을 입력하지 않으면 세금 없이 총 배당금만 계산합니다.<br />
                                • 통화(`currency`)는 현재 버전에서 `null`이므로, 금액은 모두 USD 기준 숫자로만 표시됩니다.
                            </div>

                            <div className="mt-4">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleCalculateDividend}
                                    disabled={isDividendLoading}
                                >
                                    {isDividendLoading ? "계산 중..." : "배당 계산하기"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-base font-semibold mb-1">양도소득세 계산</h2>
                            <p className="text-xs text-muted-foreground mb-2">
                                현재까지의 실현 손익(realized profit)을 기반으로 단순 모델의 예상 양도소득세를 계산합니다.
                            </p>

                            {taxError && (
                                <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs px-3 py-2 rounded-lg">
                                    {taxError}
                                </div>
                            )}

                            <Input
                                label="세율 (%)"
                                placeholder="예: 22"
                                type="number"
                                value={taxRatePercent}
                                onChange={(e) => setTaxRatePercent(e.target.value)}
                            />

                            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                                • 세율(%)은 실현 이익에 곱해질 단일 세율입니다. 예: 22 → 22%<br />
                                • 과세표준(tax base)는 음수일 경우 0으로 클램핑되어 세금이 발생하지 않습니다.<br />
                                • 통화는 현재 USD 기준이며, `currency` 필드는 1차 버전에서 `null`입니다.
                            </div>

                            <div className="mt-4">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleCalculateTax}
                                    disabled={isTaxLoading}
                                >
                                    {isTaxLoading ? "계산 중..." : "세금 계산하기"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* 결과 영역 */}
                <div className="col-span-7 flex flex-col gap-4">
                    {activeTab === "dividend" ? (
                        <div className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col">
                            <h2 className="text-base font-semibold mb-4">배당 결과 요약</h2>
                            {dividendResult ? (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">예상 총 배당금</p>
                                            <p className="text-xl font-bold">
                                                {dividendResult.totalDividend.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">예상 원천징수세</p>
                                            <p className="text-xl font-bold text-red-400">
                                                {dividendResult.withholdingTax.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">세후 수령액</p>
                                            <p className="text-xl font-bold text-green-400">
                                                {dividendResult.netDividend.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        • 실제 세법·공제·국가별 규정은 반영되지 않은 단순 모델입니다. 학습·시뮬레이션 용도로만 활용해주세요.
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                    왼쪽에서 조건을 입력하고 &quot;배당 계산하기&quot;를 눌러 결과를 확인하세요.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col">
                            <h2 className="text-base font-semibold mb-4">세금 결과 요약</h2>
                            {taxResult ? (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">실현 손익</p>
                                            <p className="text-xl font-bold">
                                                {taxResult.realizedProfit.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">과세 표준</p>
                                            <p className="text-xl font-bold">
                                                {taxResult.taxBase.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-secondary rounded-xl p-4 border border-border">
                                            <p className="text-xs text-muted-foreground mb-1">예상 세금</p>
                                            <p className="text-xl font-bold text-red-400">
                                                {taxResult.estimatedTax.toLocaleString(undefined, {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        • 마찬가지로 실제 세법과는 다를 수 있는 단순 계산입니다. 참고용으로만 사용해주세요.
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                    왼쪽에서 세율(%)을 입력하고 &quot;세금 계산하기&quot;를 눌러 결과를 확인하세요.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
