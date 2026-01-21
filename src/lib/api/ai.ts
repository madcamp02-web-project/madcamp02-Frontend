const AI_API_URL = 'http://madcampbackend.royaljellynas.org/';

export interface AIResponse {
    response: string;
}

export async function sendMessageToAI(message: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

        const response = await fetch(`${AI_API_URL}chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to communicate with AI server');
        }

        const data: AIResponse = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI API Error:', error);
        throw error;
    }
}

export async function checkAIHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${AI_API_URL}health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}
