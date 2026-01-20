// 공통 유틸 함수

import type { User } from '@/types/user';

export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/**
 * 온보딩(사주) 완료 여부를 User 정보 기반으로 판별하는 헬퍼.
 * - birthDate와 sajuElement가 모두 존재하면 완료로 본다.
 * - sajuElement가 아직 매핑되지 않았고 saju 객체만 있는 경우도 임시로 완료로 인정한다.
 */
export function hasCompletedOnboarding(user?: User | null): boolean {
  if (!user) return false;
  const hasBirthDate = !!user.birthDate;
  const hasElement = !!user.sajuElement || !!user.saju?.element;
  return hasBirthDate && hasElement;
}
