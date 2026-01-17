# 🎨 MadCamp02: 프론트엔드 개발 계획서

**Ver 3.0 - Deep Analysis & Integration Plan**

> **Critical Note**: 현재 코드베이스(`src/components`)는 대부분 **내부 Mock Data**를 사용하고 있습니다. 백엔드 연동 시 이 Mock 로직을 정확히 대체해야 합니다. 본 문서는 "어떤 Mock 코드를 어떤 API로 대체해야 하는지"를 명확히 정의합니다.

---

## 📋 목차

1. [확정된 데이터 모델 (Source of Truth)](#1-확정된-데이터-모델-source-of-truth)
2. [컴포넌트별 백엔드 연동 전략](#2-컴포넌트별-백엔드-연동-전략)
3. [상태 관리 및 API 레이어 구조](#3-상태-관리-및-api-레이어-구조)
4. [인증 및 보안 로직 상세](#4-인증-및-보안-로직-상세)

---

## 1. 확정된 데이터 모델 (Source of Truth)

`src/types/` 디렉토리의 정의가 시스템의 표준입니다.

### 1.1 User & Saju (`src/types/user.ts`)

```typescript
export interface User {
  id: string; // UUID or BigInt String
  email: string;
  nickname: string;
  profileImage?: string;
  provider: "EMAIL" | "GOOGLE" | "KAKAO";
  saju?: SajuInfo; // Optional
}

export interface SajuInfo {
  element: "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
  animal: string; // Zodiac (Rat, Ox, etc.)
  luck: string; // Daily luck text
}

export interface Wallet {
  balance: number; // 예수금
  coin: number; // 가챠 코인
  totalAsset: number; // 총 자산 (예수금 + 주식 평가액)
}
```

### 1.2 Stock & Chart (`src/types/stock.ts`)

```typescript
export interface StockPrice {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  timestamp: number;
}

export interface StockCandle {
  time: number; // Unix Timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PortfolioItem {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profit: number; // 평가 손익
  profitPercent: number; // 평가 손익률
}
```

---

## 2. 컴포넌트별 백엔드 연동 전략

현재 구현된 UI 컴포넌트와 백엔드 API의 매핑 테이블입니다.

### 2.1 `dashboard/AssetChart.tsx`

- **현재 상태**: `generateMockCandleData()` 함수로 랜덤 캔들 생성, `setInterval`로 가짜 실시간 업데이트.
- **연동 계획**:
  - **초기 로딩**: `GET /api/v1/stock/{symbol}/candles?resolution=1` 호출로 대체.
  - **실시간**: `setInterval` 제거 -> `useStockStore`의 WebSocket 구독 데이터(`updatePrice`)로 캔들 업데이트.
  - **필요 API**:
    - `GET /api/v1/stock/{symbol}/candles` (History)

### 2.2 `dashboard/OrderPanel.tsx`

- **현재 상태**: UI만 존재. 버튼 이벤트 핸들러 없음.
- **연동 계획**:
  - **Data**: `useAuthStore`의 `user.wallet.balance`를 "가능 수량" 계산에 사용.
  - **Action**: 매수/매도 버튼 클릭 시 `POST /api/v1/trade/order` 호출.
  - **필요 API**:
    - `POST /api/v1/trade/order` (Body: `{ ticker, type, quantity, price }`)

### 2.3 `dashboard/PortfolioSummary.tsx`

- **현재 상태**: 하드코딩된 더미 데이터.
- **연동 계획**:
  - `GET /api/v1/trade/portfolio` 호출하여 보유 종목 리스트 렌더링.
  - 백엔드에서 계산된 `profit`, `profitPercent`를 그대로 표시.
  - **필요 API**:
    - `GET /api/v1/trade/portfolio`

### 2.4 `lib/saju-calculator.ts`

- **현재 상태**: 클라이언트 사이드 mock 계산 로직.
- **연동 계획**:
  - 이 로직을 백엔드 `SajuService`로 이관 권장.
  - `POST /api/v1/user/onboarding` 호출 시 백엔드가 계산 후 `User` 객체에 담아 반환.
  - (옵션) 빠른 UI 피드백을 위해 프론트 로직 유지하되, 최종 데이터는 백엔드 저장.

---

## 3. 상태 관리 및 API 레이어 구조

### 3.1 Store (`src/stores/*`)

- **`stock-store.ts` 업데이트 필요**:
  - 현재: `immer` 사용, `prices` 맵 관리.
  - 추가: WebSocket 연결 상태(`connectionStatus`) 및 에러 핸들링 필드 추가.
- **`auth-store.ts` 업데이트 필요**:
  - `wallet` 정보 동기화 로직 추가 (매수 컴포넌트 등에서 즉시 반영을 위함).

### 3.2 API Layer (`src/lib/api.ts`)

- 현재 비어있는 함수들을 아래와 같이 구현해야 함:

```typescript
import axios from "axios";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // For HttpOnly Cookies if used, or Attach Bearer
});

// Interceptor for attaching Token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tradeApi = {
  placeOrder: (data: TradeOrderRequest) => client.post("/trade/order", data),
  getPortfolio: () => client.get("/trade/portfolio"),
};

export const stockApi = {
  getCandles: (ticker: string) => client.get(`/stock/candles/${ticker}`),
};
```

---

## 4. 인증 및 보안 로직 상세

### 4.1 Server Actions (`src/lib/actions.ts`)

- `authenticate` 함수는 `next-auth`의 `signIn`을 호출.
- `auth.config.ts`의 `authorized` 콜백에서 경로 보호 수행.
- **백엔드 연동**: Keycloak/Spring Security와 연동 시 `authorize` 콜백 내부에서 백엔드 로그인 API (`POST /api/v1/auth/login`) 호출 후 반환된 JWT를 세션에 저장해야 함.

### 4.2 Middleware (`src/middleware.ts`)

- 매 요청마다 `auth.config.ts` 실행.
- 토큰 만료 시 자동 로그아웃 또는 리프레시 로직 추가 고려 (Advanced).
