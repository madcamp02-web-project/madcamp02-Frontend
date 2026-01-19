import { api } from './index';

export const gameApi = {
    // Get Shop Items
    getItems: async () => {
        const { data } = await api.get('/api/v1/game/items');
        return data; // { items: [...] }
    },

    // Perform Gacha
    gacha: async (type: 'name' | 'avatar' | 'theme') => {
        const { data } = await api.post('/api/v1/game/gacha', { type });
        return data; // { item: ... }
    },

    // Get Inventory
    getInventory: async () => {
        const { data } = await api.get('/api/v1/game/inventory');
        return data; // { items: [...] }
    },

    // Equip Item
    equipItem: async (itemId: number) => {
        const { data } = await api.put(`/api/v1/game/equip/${itemId}`);
        return data;
    }
};
