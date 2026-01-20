export interface User {
    id: string;
    email: string;
    nickname: string;
    profileImage?: string;
    provider: 'EMAIL' | 'GOOGLE' | 'KAKAO';
    birthDate?: string;
    birthTime?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    calendarType?: 'SOLAR' | 'LUNAR' | 'LUNAR_LEAP';
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
    balance: number; // 예수금
    coin: number;    // 가챠 코인
    totalAsset: number;
}
