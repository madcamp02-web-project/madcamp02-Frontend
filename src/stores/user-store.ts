import { create } from 'zustand';

export interface Item {
    id: number;
    name: string;
    type: 'avatar' | 'nameplate' | 'theme';
    image: string;
    isEquipped: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserProfile {
    nickname: string;
    email: string;
    birthDate: string;
    birthTime: string;
    avatar: string; // Base avatar image path
}

interface UserStats {
    rank: number;
    profit: string;
    coins: number;
}

interface UserState {
    profile: UserProfile;
    items: Item[];
    stats: UserStats;
    isPublic: boolean;
    isRankingJoined: boolean;

    // Actions
    toggleEquip: (itemId: number) => void;
    updateProfile: (fields: Partial<UserProfile>) => void;
    setPublicProfile: (isPublic: boolean) => void;
    setRankingJoined: (isJoined: boolean) => void;
    buyItem: (item: Omit<Item, 'id' | 'isEquipped'>, price: number) => boolean; // Returns true if success
}

// Initial Mock Data
const initialProfile: UserProfile = {
    nickname: "투자도사",
    email: "investor@example.com",
    birthDate: "1995-05-20",
    birthTime: "14:30",
    avatar: "/images/oracle_sage.png",
};

const initialStats: UserStats = {
    rank: 125, // Mock rank
    profit: "+32.10%",
    coins: 2500,
};

const initialItems: Item[] = [
    { id: 1, name: "황금 왕관", type: "avatar", image: "👑", isEquipped: true, rarity: "legendary" },
    { id: 2, name: "다이아 망토", type: "avatar", image: "💎", isEquipped: true, rarity: "epic" },
    { id: 3, name: "반짝이 테두리", type: "nameplate", image: "✨", isEquipped: false, rarity: "common" },
    { id: 4, name: "골드 럭셔리 테마", type: "theme", image: "🌟", isEquipped: false, rarity: "rare" },
    { id: 5, name: "멋진 선글라스", type: "avatar", image: "😎", isEquipped: false, rarity: "common" },
];

export const useUserStore = create<UserState>((set, get) => ({
    profile: initialProfile,
    items: initialItems,
    stats: initialStats,
    isPublic: true,
    isRankingJoined: true,

    toggleEquip: (itemId) => set((state) => ({
        items: state.items.map((item) =>
            item.id === itemId
                ? { ...item, isEquipped: !item.isEquipped }
                : item
        ),
    })),

    updateProfile: (fields) => set((state) => ({
        profile: { ...state.profile, ...fields }
    })),

    setPublicProfile: (isPublic) => set({ isPublic }),
    setRankingJoined: (isRankingJoined) => set({ isRankingJoined }),

    buyItem: (itemData, price) => {
        const { stats, items } = get();
        if (stats.coins < price) return false;

        const newItem: Item = {
            ...itemData,
            id: Math.max(0, ...items.map(i => i.id)) + 1,
            isEquipped: false
        };

        set((state) => ({
            stats: { ...state.stats, coins: state.stats.coins - price },
            items: [...state.items, newItem]
        }));
        return true;
    }
}));
