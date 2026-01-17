# 📁 MadCamp02: 최종 통합 명세서

**Ver 3.0 - Final Specification (Type-Safe Edition)**

> **Critical Requirement**: API 응답 필드명은 Frontend `src/types/*.ts`의 정의와 **100% 일치(CamelCase)**해야 합니다. DB 컬럼(snake_case)을 그대로 반환하지 마십시오.

---

## 📋 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [프론트엔드 구조 (확정)](#2-프론트엔드-구조-확정)
3. [데이터 모델 매핑 (Strict)](#3-데이터-모델-매핑-strict)
4. [API 명세 (Final)](#4-api-명세-final)
5. [핵심 로직 상세](#5-핵심-로직-상세)

---

## 1. 시스템 아키텍처

```mermaid
graph TD
    Client[Client (Next.js 16)]
    Core[Core Server (Spring Boot 3.4)]
    AI[AI Server (FastAPI)]
    DB[(PostgreSQL 16)]
    Redis[(Redis 7)]

    Client -->|REST API| Core
    Client -->|WebSocket (STOMP)| Core
    Core -->|JPA| DB
    Core -->|Lettuce| Redis
    Core -->|REST/SSE| AI
```

---

## 2. 프론트엔드 구조 (확정)

실제 코드베이스(`src/`) 기반 구조입니다.

### 2.1 라우팅 (`src/app`)

- **`/`**: 대시보드 (위젯 그리드)
- **`/market`**: 시장 조회 및 검색
- **`/trade`**: 주식 매수/매도
- **`/portfolio`**: 자산 분석
- **`/shop`**: 가챠 상점 (`src/app/shop`)
- **`/oracle`**: AI 도사 채팅
- **`/ranking`**: 리더보드
- **`/mypage`**: 프로필 및 인벤토리
- **`/login`, `/onboarding`**: 인증 및 초기 설정

### 2.2 상태 관리 (`src/stores`)

- **UseAuthStore**: `user`, `token` 관리.
- **UseStockStore**: `prices` (실시간 시세), `watchlist` 관리.
- **UseUiStore**: UI 상태 관리.

---

## 3. 데이터 모델 매핑 (Strict)

Backend DTO는 반드시 아래 JSON 구조를 준수해야 합니다.

### 3.1 User & Wallet

**Frontend Type (`src/types/user.ts`)**

```typescript
interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string; // DB: avatar_url
  saju?: SajuInfo; // Optional
  wallet?: Wallet; // Embedded
}
interface Wallet {
  balance: number; // DB: cash_balance
  coin: number; // DB: game_coin
  totalAsset: number; // Calculated (cash + stock value)
}
```

**Database Schema (`users`, `wallet`)**

```sql
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    avatar_url TEXT,
    saju_data JSONB
);
CREATE TABLE wallet (
    wallet_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(user_id),
    cash_balance DECIMAL(19,4) DEFAULT 10000.0,
    game_coin INT DEFAULT 0
);
```

### 3.2 Portfolio

**Frontend Type (`src/types/stock.ts`)**

```typescript
interface PortfolioItem {
  ticker: string;
  quantity: number;
  averagePrice: number; // DB: avg_price
  currentPrice: number; // Redis/API
  profit: number; // Calculated
  profitPercent: number; // Calculated
}
```

**Database Schema (`portfolio`)**

```sql
CREATE TABLE portfolio (
    pf_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    ticker VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    avg_price DECIMAL(19,4) NOT NULL
);
```

---

## 4. API 명세 (Final)

### 4.1 User API

| Method | Endpoint                  | Description             | Frontend Function  |
| ------ | ------------------------- | ----------------------- | ------------------ |
| GET    | `/api/v1/user/me`         | 내 정보(자산 포함) 조회 | `fetchUserData`    |
| POST   | `/api/v1/user/onboarding` | 사주 정보 등록          | `updateOnboarding` |

### 4.2 Stock API

| Method | Endpoint                         | Description                   | Frontend Function |
| ------ | -------------------------------- | ----------------------------- | ----------------- |
| GET    | `/api/v1/stock/{symbol}`         | 종목 상세 조회                | `fetchStockData`  |
| GET    | `/api/v1/stock/{symbol}/candles` | 차트 데이터 (`StockCandle[]`) | `fetchCandles`    |

### 4.3 Trade API

| Method | Endpoint                  | Description                  | Frontend Function |
| ------ | ------------------------- | ---------------------------- | ----------------- |
| GET    | `/api/v1/trade/portfolio` | 포트폴리오(수익률 포함) 조회 | `fetchPortfolio`  |
| POST   | `/api/v1/trade/order`     | 매수/매도 주문               | `executeTrade`    |

### 4.4 Game API

| Method | Endpoint               | Description    | Frontend Function |
| ------ | ---------------------- | -------------- | ----------------- |
| GET    | `/api/v1/game/ranking` | 전체 랭킹 조회 | `fetchRanking`    |
| POST   | `/api/v1/game/gacha`   | 가챠 뽑기      | `pullGacha`       |

---

## 5. 핵심 로직 상세

1.  **실시간 수익률 계산**:
    - 프론트엔드가 `/api/v1/trade/portfolio` 요청 시, 백엔드는 DB의 `avg_price`와 Redis의 `current_price`를 비교하여 `profit`, `profitPercent`를 계산해 DTO에 담아 응답해야 합니다.

2.  **가챠 시스템**:
    - `GachaItem` 타입의 `rarity` 필드를 기준으로 백엔드에서 확률 로직을 수행합니다.

3.  **사주 분석**:
    - 프론트엔드 `saju-calculator.ts` 로직과 백엔드 `OnboardingRequest` 처리 로직이 정합성을 가져야 합니다. (프론트에서 계산 후 전송 또는 백엔드에서 재계산)
