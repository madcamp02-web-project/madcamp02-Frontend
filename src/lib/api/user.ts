import { api } from './index';
import { User, Wallet } from '@/types/user';

export const userApi = {
    // Get Me (Profile)
    getProfile: async () => {
        const { data } = await api.get<User>('/api/v1/user/me');
        return data;
    },

    // Update Profile
    updateProfile: async (data: Partial<User>) => {
        const { data: response } = await api.put<User>('/api/v1/user/me', data);
        return response;
    },

    // Get Wallet Balance
    getWallet: async () => {
        const { data } = await api.get<Wallet>('/api/v1/user/wallet');
        return data; // { balance, coin, totalAsset }
    },

    // Onboarding (Saju)
    submitOnboarding: async (data: any) => {
        const { data: response } = await api.post('/api/v1/user/onboarding', data);
        return response;
    }
};
