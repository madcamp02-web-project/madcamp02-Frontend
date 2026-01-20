import { api } from './index';
import { User, Wallet } from '@/types/user';
import { UserWatchlistResponse } from '@/types/api';

export interface OnboardingRequest {
    nickname: string;
    birthDate: string;
    birthTime?: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    calendarType: 'SOLAR' | 'LUNAR' | 'LUNAR_LEAP';
}

export const userApi = {
    // Get Me (Profile)
    getProfile: async (): Promise<User> => {
        const { data } = await api.get<User>('/api/v1/user/me');
        return data;
    },

    // Update Profile
    updateProfile: async (profileData: Partial<User>): Promise<User> => {
        const { data } = await api.put<User>('/api/v1/user/me', profileData);
        return data;
    },

    // Get Wallet Balance
    getWallet: async (): Promise<Wallet> => {
        const { data } = await api.get<Wallet>('/api/v1/user/wallet');
        return data;
    },

    // Onboarding (Saju)
    submitOnboarding: async (onboardingData: OnboardingRequest) => {
        const { data } = await api.post('/api/v1/user/onboarding', onboardingData);
        return data;
    },

    // Get Watchlist
    getWatchlist: async (): Promise<UserWatchlistResponse> => {
        const { data } = await api.get<UserWatchlistResponse>('/api/v1/user/watchlist');
        return data;
    },

    // Add to Watchlist
    addWatchlist: async (ticker: string): Promise<UserWatchlistResponse> => {
        const { data } = await api.post<UserWatchlistResponse>('/api/v1/user/watchlist', { ticker });
        return data;
    },

    // Remove from Watchlist
    removeWatchlist: async (ticker: string): Promise<UserWatchlistResponse> => {
        const { data } = await api.delete<UserWatchlistResponse>(`/api/v1/user/watchlist/${encodeURIComponent(ticker)}`);
        return data;
    },
};
