// 글로벌 타입 정의

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalAssets: number;
  profitRate: number;
  rank?: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface PortfolioItem {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
}

export interface GachaItem {
  id: string;
  name: string;
  type: "name" | "avatar" | "theme";
  rarity: "common" | "rare" | "epic" | "legendary";
  image: string;
  description: string;
}

export interface SajuInfo {
  birthDate: string;
  birthTime?: string;
  birthLocation?: string;
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
}
