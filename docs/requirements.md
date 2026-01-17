# Stock-Persona: Frontend Development Blueprint (Ver 1.0)

## 1. Project Overview
A reactive mock investment platform combining financial data with "Saju" (Oriental Fortune Telling) lore.

## 2. Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand (Auth, User, Stock, Portfolio, UI)
- **Network**: Axios (REST), StompJS (WebSocket), EventSource (SSE)
- **UI**: Tailwind CSS 4, Shadcn/UI, Recharts/Lightweight Charts
- **Auth**: NextAuth.js (Google OAuth)

### Layer Architecture
- **Presentation**: Components (UI, Feature, Layout) -> Pages
- **State**: Zustand Stores -> Custom Hooks
- **Service**: API Clients (Axios, STOMP)
- **External**: Spring Boot, FastAPI, Redis

## 3. Directory Structure (Summary)
- `app/`: Pages (login, onboarding, oracle, gacha, ranking, mypage, calculator)
- `components/`:
    - `auth/`: Login, Onboarding
    - `dashboard/`: Charts (Candle/Area), Trade, Watchlist, Avatar, etc.
    - `common/`: Loaders, Skeletons
- `stores/`: Zustand stores
- `lib/api/`: API modules
- `hooks/`: Custom hooks (useStockPrice, useWebSocket, etc.)

## 4. Key Features & Pages
1. **Login (`/login`)**: Google OAuth, Saju theme background.
2. **Onboarding (`/onboarding`)**: Date of birth input -> Saju analysis.
3. **Dashboard (`/`)**: Drag & Drop widget grid, Real-time charts.
4. **Oracle (`/oracle`)**: AI Chatbot with streaming via SSE.
5. **Gacha (`/gacha`)**: Capsule toy machine for items.
6. **Ranking (`/ranking`)**: Real-time profit leaderboard.
7. **MyPage (`/mypage`)**: Portfolio, Inventory, Avatar customization.

## 5. UI/UX System
- **Colors**:
    - Primary: Gold (oklch)
    - Stock: Red (Bull), Blue (Bear)
- **Animations**: Avatar pulse, Trade success, Gacha bounce.
- **Responsive**: Mobile (<640px), Tablet, Desktop.

## 6. Development Roadmap
- **Phase 1**: Infrastructure Setup (Zustand, API Client, Layout)
- **Phase 2**: Auth & Onboarding (Login UI -> Logic)
- **Phase 3**: Real-time System (WebSocket, Candle Charts)
- **Phase 4**: Trading & Portfolio
- **Phase 5**: AI System Integration
- **Phase 6**: Gamification (Gacha, Ranking)
