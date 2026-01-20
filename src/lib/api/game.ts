import { api } from './index';
import {
    ItemsResponse,
    GachaResponse,
    InventoryResponse,
    RankingResponse,
} from '@/types/api';

export type ItemCategory = 'NAMEPLATE' | 'AVATAR' | 'THEME';

export const gameApi = {
    // Get Shop Items
    getItems: async (category?: ItemCategory): Promise<ItemsResponse> => {
        const params = category ? `?category=${category}` : '';
        const { data } = await api.get<ItemsResponse>(`/api/v1/game/items${params}`);
        return data;
    },

    // Perform Gacha
    gacha: async (category: ItemCategory): Promise<GachaResponse> => {
        const { data } = await api.post<GachaResponse>('/api/v1/game/gacha', { category });
        return data;
    },

    // Get Inventory
    getInventory: async (): Promise<InventoryResponse> => {
        const { data } = await api.get<InventoryResponse>('/api/v1/game/inventory');
        return data;
    },

    // Equip Item
    equipItem: async (itemId: number): Promise<InventoryResponse> => {
        const { data } = await api.put<InventoryResponse>(`/api/v1/game/equip/${itemId}`);
        return data;
    },

    // Get Ranking
    getRanking: async (): Promise<RankingResponse> => {
        const { data } = await api.get<RankingResponse>('/api/v1/game/ranking');
        return data;
    },
};
