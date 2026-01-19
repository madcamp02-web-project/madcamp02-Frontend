import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;

    isChatbotOpen: boolean;
    toggleChatbot: () => void;
    openChatbot: () => void;
    closeChatbot: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true, // Default open
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),
    openSidebar: () => set({ isSidebarOpen: true }),

    // Chatbot State
    isChatbotOpen: false,
    toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
    openChatbot: () => set({ isChatbotOpen: true }),
    closeChatbot: () => set({ isChatbotOpen: false }),
}));
