export interface User {
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
    provider: 'EMAIL' | 'GOOGLE' | 'KAKAO';
    // 온보딩에서 확정하는 기본 사주/프로필 필드
    birthDate?: string;
    birthTime?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    calendarType?: 'SOLAR' | 'LUNAR' | 'LUNAR_LEAP';
    /**
     * 서버에 저장되는 최종 사주 오행 요약 (users.saju_element)
     * 온보딩 완료 여부 판별에 사용된다.
     */
    sajuElement?: 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';
    /**
     * 띠(十二支) 등 최종 사주 띠 정보 (users.zodiac_sign)
     */
    zodiacSign?: string;
    /**
     * 프론트 전용 사주 정보 구조체.
     * 온보딩 결과 화면 등에서 사용하며, sajuElement와 중복될 수 있다.
     */
    saju?: SajuInfo;
    isPublic?: boolean;
    isRankingJoined?: boolean;
}

export interface SajuInfo {
    element: 'WOOD' | 'FIRE' | 'EARTH' | 'METAL' | 'WATER';
    animal: string; // 띠
    luck: string; // 운세 요약
}

export interface Wallet {
    cashBalance: number; // 예수금
    gameCoin: number;    // 가챠 코인
    totalAssets: number;
    realizedProfit: number;
}
