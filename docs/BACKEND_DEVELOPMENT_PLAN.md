# ⚙️ MadCamp02: 백엔드 개발 계획서

**Ver 3.0 - Backend Development Blueprint (Type-Safe Edition)**

> **Critical Note**: `docs/FULL_SPECIFICATION.md` (Ver 3.0)를 준수해야 합니다. 특히 **API Response DTO는 프론트엔드 타입(`src/types/*.ts`)과 필드명이 정확히 일치(CamelCase)**해야 합니다.

---

## 📋 목차

1. [개발 목표 및 범위](#1-개발-목표-및-범위)
2. [API 구현 계획 (Frontend Driven)](#2-api-구현-계획-frontend-driven)
3. [데이터베이스 스키마와 DTO 매핑전략](#3-데이터베이스-스키마와-dto-매핑전략)
4. [핵심 비즈니스 로직](#4-핵심-비즈니스-로직)
5. [개발 로드맵](#5-개발-로드맵)

---

## 1. 개발 목표 및 범위

프론트엔드(`src/`)의 완성된 구조와 데이터 모델(`types.ts`)을 완벽하게 지원하는 REST API 및 WebSocket 서버를 구축합니다.

### 핵심 목표

1.  **데이터 정합성 (Type Safety)**: DTO 매핑을 통해 DB의 Snake_Case를 Frontend의 CamelCase로 완벽 변환.
2.  **실시간성**: `StockStore`가 요구하는 실시간 주가 데이터를 WebSocket으로 지연 없이 전송.
3.  **안정성**: OAuth2 인증 및 JWT 토큰 관리의 보안성 강화.

---

## 2. API 구현 계획 (Frontend Driven)

`src/lib/api.ts`의 함수들이 호출할 엔드포인트입니다.

### 2.1 User Module (`UserController`)

- `GET /api/v1/user/me`
  - **Response**: `UserResponse` DTO (camelCase 필수)
  - **Mapping**: `users.avatar_url` -> `user.profileImage`, `wallet.cash_balance` -> `wallet.balance`

### 2.2 Stock Module (`StockController`)

- `GET /api/v1/stock/{symbol}`
  - **Response**: `StockPrice` DTO.
- `GET /api/v1/stock/{symbol}/candles`
  - **Response**: `StockCandle[]` List.

### 2.3 Trade Module (`TradeController`)

- `GET /api/v1/trade/portfolio`
  - **Response**: `PortfolioItem[]`
  - **Logic**: DB 조회(`avg_price`) + Redis 조회(`current_price`) -> `profit`, `profitPercent` 계산 후 응답.
- `POST /api/v1/trade/order`
  - **Request**: `{ ticker, quantity, type: 'BUY'|'SELL' }`
- **Logic**: 원자적 트랜잭션 처리 (지갑 차감 <-> 포트폴리오 갱신).

### 2.4 Game Module (`GameController`)

- `POST /api/v1/game/gacha`
  - **Logic**: 가중치 랜덤 알고리즘으로 아이템 생성.

---

## 3. 데이터베이스 스키마와 DTO 매핑전략

### 3.1 MapStruct 도입 권장

수동 매핑 실수를 방지하기 위해 `MapStruct` 사용을 강력 권장합니다.

```java
@Mapper
public interface UserMapper {
    @Mapping(source = "avatarUrl", target = "profileImage")
    @Mapping(source = "wallet.cashBalance", target = "wallet.balance")
    @Mapping(source = "wallet.gameCoin", target = "wallet.coin")
    UserResponse toDto(User entity);
}
```

### 3.2 Schema Definition (Confirm)

```sql
-- Users (User 타입 매핑)
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    avatar_url TEXT,
    saju_data JSONB
);

-- Wallet (User.totalAssets 계산용)
CREATE TABLE wallet (
    wallet_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(user_id),
    cash_balance DECIMAL(19,4) DEFAULT 10000.0,
    game_coin INT DEFAULT 0
);

-- Portfolio (PortfolioItem 타입 매핑)
CREATE TABLE portfolio (
    pf_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    ticker VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    avg_price DECIMAL(19,4) NOT NULL
);
```

---

## 4. 핵심 비즈니스 로직

### 4.1 수익률 계산 (Dynamic Calculation)

DB에 정적으로 저장하지 않고 조회 시마다 계산합니다.

```java
// Logic for PortfolioItem.profitPercent
BigDecimal currentPrice = redisService.getPrice(ticker);
BigDecimal avgPrice = entity.getAvgPrice();
BigDecimal profit = (currentPrice - avgPrice) * quantity;
BigDecimal profitPercent = (currentPrice - avgPrice) / avgPrice * 100;
```

### 4.2 가챠 확률 (Weighted Random)

```java
// Common: 60%, Rare: 30%, Epic: 9%, Legendary: 1%
double random = Math.random();
// ...
```

---

## 5. 개발 로드맵

1.  **Phase 1: API Skeleton & DTO Definition** (Critical)
    - `UserResponse`, `StockPrice`, `PortfolioItem` 등 DTO 클래스 작성 (필드명 검수).
    - MapStruct 설정 및 Entity-DTO 매핑 테스트.

2.  **Phase 2: Core Logic Implementation**
    - `TradeService`: 매수/매도 트랜잭션.
    - `UserService`: 동적 자산 계산 로직.

3.  **Phase 3: Real-time & External**
    - WebSocket 핸들러 구현.
    - Finnhub 데이터 연동.
