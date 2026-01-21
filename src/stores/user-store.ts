import { create } from 'zustand';
import { User, Wallet } from '@/types/user';
import { InventoryItem } from '@/types/api';
import { userApi } from '@/lib/api/user';
import { gameApi } from '@/lib/api/game';

interface UserState {
    // Profile data (from User API)
    profile: User | null;
    // Inventory items (from Game API)
    items: InventoryItem[];
    // Wallet stats (from Wallet API)
    wallet: Wallet | null;
    // Settings
    isPublic: boolean;
    isRankingJoined: boolean;
    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProfile: () => Promise<void>;
    fetchInventory: () => Promise<void>;
    fetchWallet: () => Promise<void>;
    updateProfile: (fields: Partial<User>) => Promise<void>;
    toggleEquip: (itemId: number) => Promise<void>;
    setPublicProfile: (isPublic: boolean) => Promise<void>;
    setRankingJoined: (isJoined: boolean) => Promise<void>;
    setProfileData: (profile: User) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    profile: null,
    items: [],
    wallet: null,
    isPublic: true,
    isRankingJoined: true,
    isLoading: false,
    error: null,

    fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const profile = await userApi.getProfile();
            set({
                profile,
                isPublic: profile.isPublic ?? true,
                isRankingJoined: profile.isRankingJoined ?? true,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch profile',
                isLoading: false
            });
            throw error;
        }
    },

    fetchInventory: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await gameApi.getInventory();
            set({ items: response.items, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch inventory',
                isLoading: false
            });
            throw error;
        }
    },

    fetchWallet: async () => {
        set({ isLoading: true, error: null });
        try {
            const wallet = await userApi.getWallet();
            set({ wallet, isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch wallet',
                isLoading: false
            });
            throw error;
        }
    },

    updateProfile: async (fields: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
            const updatedProfile = await userApi.updateProfile(fields);
            set({
                profile: updatedProfile,
                isPublic: updatedProfile.isPublic ?? get().isPublic,
                isRankingJoined: updatedProfile.isRankingJoined ?? get().isRankingJoined,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to update profile',
                isLoading: false
            });
            throw error;
        }
    },

    toggleEquip: async (itemId: number) => {
        set({ isLoading: true, error: null });
        try {
            await gameApi.equipItem(itemId);
            // Refresh inventory after equip
            await get().fetchInventory();
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to equip item',
                isLoading: false
            });
            throw error;
        }
    },

    setPublicProfile: async (isPublic: boolean) => {
        await get().updateProfile({ isPublic });
    },

    setRankingJoined: async (isJoined: boolean) => {
        await get().updateProfile({ isRankingJoined: isJoined });
    },

    setProfileData: (profileData: User) => {
        set({
            profile: profileData,
            isPublic: profileData.isPublic ?? get().isPublic,
            isRankingJoined: profileData.isRankingJoined ?? get().isRankingJoined,
        });
    },
}));
