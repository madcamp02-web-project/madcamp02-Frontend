import { create } from 'zustand';

export interface ChatMessage {
    text: string;
    isUser: boolean;
}

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;

    // Actions
    addMessage: (message: ChatMessage) => void;
    setLoading: (loading: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [
        { text: "안녕하세요. 나는 천년을 살아온 투자 도사라네.\n자네의 투자와 운세에 대해 무엇이든 물어보게나.", isUser: false }
    ],
    isLoading: false,

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    setLoading: (loading) => set({ isLoading: loading }),
    clearMessages: () => set({
        messages: [
            { text: "안녕하세요. 나는 천년을 살아온 투자 도사라네.\n자네의 투자와 운세에 대해 무엇이든 물어보게나.", isUser: false }
        ]
    }),
}));
