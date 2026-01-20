"use client";

import React, { useEffect, useState } from 'react';
import { useUserStore } from "@/stores/user-store";
import { userApi } from "@/lib/api/user";
import { useAuthStore } from "@/stores/auth-store";

export default function MyPage() {
    // Global Store
    const {
        profile,
        items,
        wallet,
        isPublic,
        isRankingJoined,
        isLoading,
        fetchProfile,
        fetchInventory,
        fetchWallet,
        toggleEquip,
        updateProfile,
        setPublicProfile,
        setRankingJoined
    } = useUserStore();

    const { checkAuth } = useAuthStore();

    // 사주/온보딩 관련 로컬 상태 (마이페이지에서 재계산에만 사용)
    const [birthDate, setBirthDate] = useState<string>("");
    const [birthTime, setBirthTime] = useState<string>("");
    const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
    const [calendarType, setCalendarType] = useState<"SOLAR" | "LUNAR" | "LUNAR_LEAP">("SOLAR");
    const [recalcLoading, setRecalcLoading] = useState(false);
    const [recalcError, setRecalcError] = useState<string | null>(null);
    const [recalcSuccess, setRecalcSuccess] = useState<string | null>(null);

    // 초기 로드
    useEffect(() => {
        fetchProfile().catch(() => {});
        fetchInventory().catch(() => {});
        fetchWallet().catch(() => {});
    }, [fetchProfile, fetchInventory, fetchWallet]);

    // 프로필 변화 시 로컬 사주 입력값 동기화
    useEffect(() => {
        if (!profile) return;
        setBirthDate(profile.birthDate || "");
        setBirthTime(profile.birthTime || "");
        setGender(profile.gender || "");
        setCalendarType(profile.calendarType || "SOLAR");
    }, [profile]);

    const handleRecalculateSaju = async () => {
        if (!profile) return;

        setRecalcError(null);
        setRecalcSuccess(null);

        // 간단 검증
        if (!birthDate || !gender || !calendarType) {
            setRecalcError("생년월일, 성별, 달력 유형은 필수입니다.");
            return;
        }

        // 확인 모달
        const confirmed = window.confirm("사주 정보를 다시 계산하시겠습니까? 기존 사주 기반 분석이 모두 새 값으로 대체됩니다.");
        if (!confirmed) return;

        try {
            setRecalcLoading(true);
            await userApi.submitOnboarding({
                nickname: profile.nickname,
                birthDate,
                birthTime: birthTime || undefined,
                gender: gender as "MALE" | "FEMALE" | "OTHER",
                calendarType,
            });

            // 온보딩과 동일하게 /user/me 및 연관 스토어를 최신화한다.
            try {
                await checkAuth();
            } catch (refreshError) {
                console.warn("[MyPage] checkAuth after saju recalc failed:", refreshError);
            }

            setRecalcSuccess("사주 정보가 다시 계산되었습니다.");
        } catch (error: any) {
            const msg = error?.response?.data?.message || "사주 재계산 중 오류가 발생했습니다.";
            setRecalcError(msg);
        } finally {
            setRecalcLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-background" suppressHydrationWarning>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border shrink-0 flex justify-between items-center bg-background">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        👤 마이페이지
                    </h1>
                    <p className="text-muted-foreground text-sm">나만의 개성을 뽐내고 설정을 관리하세요</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground text-xs">보유 코인</p>
                    <p className="text-yellow-500 dark:text-yellow-400 font-bold text-xl">
                        {wallet?.coin !== undefined ? wallet.coin.toLocaleString() : '0'}
                    </p>
                    <p className="text-green-500 dark:text-green-400 text-xs text-right font-medium">
                        총 자산 ${wallet?.totalAsset !== undefined ? wallet.totalAsset.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                    </p>
                </div>
            </div>

            {/* Main Content - 3 Column Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="min-h-full grid grid-cols-12 gap-6">

                    {/* Left Column: Avatar Preview (3/12) */}
                    <div className="col-span-3 bg-card border border-border rounded-2xl p-6 flex flex-col items-center">
                        <h2 className="text-foreground font-bold mb-6 self-start border-b-2 border-yellow-500 pb-1">미리보기</h2>
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            {/* Avatar Circle with Effects */}
                            <div className="relative w-48 h-48 mb-6 group">
                                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/30 transition-all duration-500"></div>
                                <div className="relative w-full h-full rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                                    {profile?.profileImage ? (
                                        <img
                                            src={profile.profileImage}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl">
                                            👤
                                        </div>
                                    )}
                                </div>
                                {/* Equipped Item Overlays (Visual Only) */}
                                {items.find(i => i.equipped && i.category === 'AVATAR') && (
                                    <div className="absolute -top-6 -right-2 text-6xl drop-shadow-lg filter rotate-12 animate-bounce">
                                        👑
                                    </div>
                                )}
                            </div>

                            <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                                ✨ {profile?.nickname || '사용자'} ✨
                            </h3>
                            <div className="flex gap-2 text-2xl">
                                {items.filter(i => i.equipped).map(item => (
                                    <span key={item.itemId} title={item.name}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <span>🎁</span>
                                        )}
                                    </span>
                                ))}
                            </div>

                            <button className="mt-8 w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20">
                                아바타 변경하기 (5,000💎)
                            </button>
                        </div>
                    </div>

                    {/* Middle Column: Item Management (4/12) */}
                    <div className="col-span-4 bg-card border border-border rounded-2xl p-6 flex flex-col">
                        <h2 className="text-foreground font-bold mb-6 border-b-2 border-blue-500 pb-1 self-start">꾸미기 옵션</h2>

                        <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                            {/* Equipped Section */}
                            <div>
                                <h3 className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">장착 중인 아이템</h3>
                                <div className="space-y-2">
                                    {items.filter(i => i.equipped).map(item => (
                                        <div key={item.itemId} className="bg-secondary border border-border rounded-xl p-3 flex items-center justify-between group hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-black/5 dark:bg-black/30 rounded-lg flex items-center justify-center text-xl border border-border">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span>🎁</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-foreground font-medium text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleEquip(item.itemId)}
                                                className="px-3 py-1 bg-black/5 dark:bg-white/10 text-destructive dark:text-white text-xs rounded-lg hover:bg-black/10 dark:hover:bg-white/20 border border-border transition-colors"
                                            >
                                                해제
                                            </button>
                                        </div>
                                    ))}
                                    {items.filter(i => i.equipped).length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground text-sm italic">
                                            장착된 아이템이 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-[1px] bg-border my-2"></div>

                            {/* Inventory Section */}
                            <div>
                                <h3 className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">미장착 아이템</h3>
                                <div className="space-y-2">
                                    {items.filter(i => !i.equipped).map(item => (
                                        <div key={item.itemId} className="bg-secondary border border-border rounded-xl p-3 flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-black/5 dark:bg-black/30 rounded-lg flex items-center justify-center text-xl border border-border">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span>🎁</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground dark:text-gray-300 font-medium text-sm group-hover:text-foreground dark:group-hover:text-white transition-colors">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleEquip(item.itemId)}
                                                className="px-3 py-1 bg-yellow-500 text-black font-bold text-xs rounded-lg hover:bg-yellow-400 shadow-md shadow-yellow-500/10 transition-all"
                                            >
                                                장착
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                        {/* Right Column: Settings (5/12) */}
                        <div className="col-span-5 flex flex-col gap-6">
                            {/* Account Settings */}
                            <div className="flex-[2] bg-card border border-border rounded-2xl p-6">
                                <h2 className="text-foreground font-bold mb-6 border-b-2 border-purple-500 pb-1 self-start">계정 설정</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-muted-foreground text-xs mb-1.5">닉네임</label>
                                        <input
                                            type="text"
                                            value={profile?.nickname || ''}
                                            onChange={(e) => updateProfile({ nickname: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-muted-foreground text-xs mb-1.5">이메일</label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            onChange={(e) => updateProfile({ email: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>

                                    {/* 사주/온보딩 설정 - 재계산 지원 */}
                                    <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-3">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            사주 정보(생년월일/시간/성별/달력)는 AI 도사 조언과 캐릭터 컨셉에 영향을 줍니다. 잘못 입력했다면 아래 값을 수정한 뒤{" "}
                                            <span className="font-semibold text-foreground">사주 다시 계산하기</span>를 눌러주세요.
                                        </p>

                                        {recalcError && (
                                            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs px-3 py-2 rounded-lg">
                                                {recalcError}
                                            </div>
                                        )}
                                        {recalcSuccess && (
                                            <div className="bg-green-500/10 border border-green-500/40 text-green-400 text-xs px-3 py-2 rounded-lg">
                                                {recalcSuccess}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-muted-foreground text-xs mb-1.5">생년월일</label>
                                                <input
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-muted-foreground text-xs mb-1.5">태어난 시각 (선택)</label>
                                                <input
                                                    type="time"
                                                    value={birthTime}
                                                    onChange={(e) => setBirthTime(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-muted-foreground text-xs mb-1.5">성별</label>
                                                <select
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "OTHER" | "")}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                                >
                                                    <option value="">선택하세요</option>
                                                    <option value="MALE">남성</option>
                                                    <option value="FEMALE">여성</option>
                                                    <option value="OTHER">기타</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-muted-foreground text-xs mb-1.5">달력 종류</label>
                                                <select
                                                    value={calendarType}
                                                    onChange={(e) => setCalendarType(e.target.value as "SOLAR" | "LUNAR" | "LUNAR_LEAP")}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-purple-500 transition-colors"
                                                >
                                                    <option value="SOLAR">양력</option>
                                                    <option value="LUNAR">음력</option>
                                                    <option value="LUNAR_LEAP">음력(윤달)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                            <p>현재 사주 오행: <span className="font-semibold text-foreground">{profile?.sajuElement || '미설정'}</span></p>
                                            <p>현재 띠: <span className="font-semibold text-foreground">{profile?.zodiacSign || '미설정'}</span></p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleRecalculateSaju}
                                            disabled={recalcLoading || !profile}
                                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {recalcLoading ? "사주 다시 계산 중..." : "사주 다시 계산하기"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        {/* Public Settings */}
                        <div className="flex-[1] bg-card border border-border rounded-2xl p-6">
                            <h2 className="text-foreground font-bold mb-4 border-b-2 border-green-500 pb-1 self-start">공개 설정</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-lg">🌐</div>
                                        <div>
                                            <p className="text-foreground text-sm font-medium">프로필 공개</p>
                                            <p className="text-muted-foreground text-xs">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPublicProfile(!isPublic)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${isPublic ? 'bg-green-500 text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        {isPublic ? '공개' : '비공개'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-lg">📊</div>
                                        <div>
                                            <p className="text-foreground text-sm font-medium">랭킹 참여</p>
                                            <p className="text-muted-foreground text-xs">수익률 랭킹에 참여합니다</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setRankingJoined(!isRankingJoined)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${isRankingJoined ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-white text-gray-600 dark:text-black'}`}
                                    >
                                        {isRankingJoined ? '참여 중' : '미참여'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
