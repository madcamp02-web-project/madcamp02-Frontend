import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class SocketClient {
    private client: Client;
    private connected = false;

    constructor() {
        this.client = new Client({
            // Ensure we use the correct broker URL
            // In development, we use SockJS usually
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str) => {
                console.log('[STOMP]:', str);
            },
            onConnect: () => {
                console.log('[STOMP] Connected');
                this.connected = true;
            },
            onDisconnect: () => {
                console.log('[STOMP] Disconnected');
                this.connected = false;
            },
            onStompError: (frame) => {
                console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
                console.error('[STOMP] Additional details: ' + frame.body);
            },
        });
    }

    public connect() {
        if (!this.client.active) {
            this.client.activate();
        }
    }

    public disconnect() {
        if (this.client.active) {
            this.client.deactivate();
        }
    }

    public subscribe(destination: string, callback: (message: IMessage) => void) {
        if (!this.client.active) {
            console.warn('[STOMP] Client not active, cannot subscribe');
            return;
        }
        return this.client.subscribe(destination, callback);
    }

    public isConnected() {
        return this.connected;
    }
}

// Singleton instance
export const socketClient = new SocketClient();
