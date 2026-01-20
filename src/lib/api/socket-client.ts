import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/auth-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

class SocketClient {
    private client: Client;
    private connected = false;
    private subscriptions: Map<string, any> = new Map();
    private connectPromise: Promise<void> | null = null;
    private connectResolve: (() => void) | null = null;
    private connectReject: ((error: Error) => void) | null = null;

    constructor() {
        this.client = new Client({
            // WebSocket 엔드포인트 (문서 10.2 기준: /ws-stomp)
            webSocketFactory: () => new SockJS(`${WS_URL}/ws-stomp`),
            debug: (str) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[STOMP]:', str);
                }
            },
            connectHeaders: () => {
                // 인증 토큰 헤더 추가
                const token = useAuthStore.getState().token;
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
            onConnect: () => {
                console.log('[STOMP] Connected');
                this.connected = true;
                // 연결 완료 시 Promise resolve
                if (this.connectResolve) {
                    this.connectResolve();
                    this.connectResolve = null;
                    this.connectReject = null;
                }
            },
            onDisconnect: () => {
                console.log('[STOMP] Disconnected');
                this.connected = false;
                this.subscriptions.clear();
                // 연결 실패 시 Promise reject
                if (this.connectReject) {
                    this.connectReject(new Error('[STOMP] Disconnected'));
                    this.connectResolve = null;
                    this.connectReject = null;
                }
                this.connectPromise = null;
            },
            onStompError: (frame) => {
                console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
                console.error('[STOMP] Additional details: ' + frame.body);
                // 연결 실패 시 Promise reject
                if (this.connectReject) {
                    this.connectReject(new Error('[STOMP] ' + frame.headers['message']));
                    this.connectResolve = null;
                    this.connectReject = null;
                    this.connectPromise = null;
                }
            },
        });
    }

    private waitForConnection(): Promise<void> {
        // 이미 연결되어 있으면 즉시 반환
        if (this.connected && this.client.connected) {
            return Promise.resolve();
        }

        // 연결 중이면 기존 Promise 반환
        if (this.connectPromise) {
            return this.connectPromise;
        }

        // 연결 시작
        if (!this.client.active) {
            this.client.activate();
        }

        // 연결 완료를 기다리는 Promise 생성
        this.connectPromise = new Promise((resolve, reject) => {
            this.connectResolve = resolve;
            this.connectReject = reject;

            // 타임아웃 설정 (10초)
            setTimeout(() => {
                if (this.connectReject) {
                    this.connectReject(new Error('[STOMP] Connection timeout'));
                    this.connectResolve = null;
                    this.connectReject = null;
                    this.connectPromise = null;
                }
            }, 10000);
        });

        return this.connectPromise;
    }

    public connect() {
        if (!this.client.active) {
            this.client.activate();
        }
        return this.waitForConnection();
    }

    public disconnect() {
        if (this.client.active) {
            this.client.deactivate();
        }
    }

    public async subscribe(destination: string, callback: (message: IMessage) => void) {
        // 연결이 완료될 때까지 대기
        try {
            await this.waitForConnection();
        } catch (error) {
            console.error('[STOMP] Failed to connect:', error);
            return null;
        }
        
        // 이미 구독 중이면 해제 후 재구독
        if (this.subscriptions.has(destination)) {
            this.unsubscribe(destination);
        }
        
        try {
            const subscription = this.client.subscribe(destination, callback);
            this.subscriptions.set(destination, subscription);
            return subscription;
        } catch (error) {
            console.error('[STOMP] Failed to subscribe:', error);
            return null;
        }
    }

    public unsubscribe(destination: string) {
        const subscription = this.subscriptions.get(destination);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    public isConnected() {
        return this.connected;
    }
}

// Singleton instance
export const socketClient = new SocketClient();
