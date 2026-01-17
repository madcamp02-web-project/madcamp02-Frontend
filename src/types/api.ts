export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: ErrorResponse;
}

export interface ErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
}

export enum ErrorCode {
    AUTH_EXPIRED_TOKEN = 'AUTH_001',
    AUTH_INVALID_TOKEN = 'AUTH_002',
    AUTH_ACCESS_DENIED = 'AUTH_003',
    TRADE_INSUFFICIENT_BALANCE = 'TRADE_001',
    // ... add others as needed
}
