// 샘플/Mock 데이터

import { User, Stock, PortfolioItem, GachaItem } from "./types";

export const mockUser: User = {
  id: "user1",
  name: "황금손",
  email: "investor@example.com",
  totalAssets: 2500,
  profitRate: 24.5,
  rank: 42,
};

export const mockStocks: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 167.20,
    change: 17.00,
    changePercent: 11.32,
    volume: 45200000,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 485.30,
    change: 12.50,
    changePercent: 2.65,
    volume: 28200000,
  },
];

export const mockPortfolio: PortfolioItem[] = [
  {
    symbol: "AAPL",
    quantity: 10,
    avgPrice: 150.00,
    currentPrice: 167.20,
    profit: 172.00,
    profitPercent: 11.47,
  },
  {
    symbol: "NVDA",
    quantity: 5,
    avgPrice: 420.00,
    currentPrice: 485.30,
    profit: 326.50,
    profitPercent: 15.55,
  },
];

export const mockGachaItems: GachaItem[] = [
  {
    id: "g1",
    name: "별빛 테두리",
    type: "name",
    rarity: "common",
    image: "/gacha/star-border.jpg",
    description: "이름 주변에 반짝이는 별",
  },
];
