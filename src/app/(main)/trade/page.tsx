"use client";

import React, { useState } from 'react';
import OrderPanel from '@/components/dashboard/OrderPanel';

// Mock Data
import { usePortfolioStore } from '@/stores/portfolio-store';

// Mock Data
const watchlistStocks = [
  { code: "AAPL", name: "애플 (Apple)", price: 167.20, change: "+1.24%" },
  { code: "TSLA", name: "테슬라 (Tesla)", price: 245.80, change: "+2.14%" },
  { code: "NVDA", name: "엔비디아 (NVIDIA)", price: 460.10, change: "+3.49%" },
  { code: "MSFT", name: "마이크로소프트", price: 330.40, change: "+1.93%" },
  { code: "GOOGL", name: "구글 (Alphabet)", price: 135.50, change: "-0.75%" },
  { code: "AMZN", name: "아마존 (Amazon)", price: 140.20, change: "+1.94%" },
];

const orderBookAsks = [ // 매도호가 (빨간색, 위에서 아래로)
  { price: 71600, quantity: 5597 },
  { price: 71700, quantity: 9268 },
  { price: 71800, quantity: 4378 },
  { price: 71900, quantity: 1491 },
  { price: 72000, quantity: 5952 },
];

const orderBookBids = [ // 매수호가 (파란색, 위에서 아래로)
  { price: 71400, quantity: 7967 },
  { price: 71300, quantity: 2745 },
  { price: 71200, quantity: 5015 },
  { price: 71100, quantity: 4355 },
  { price: 71000, quantity: 426 },
];

// Helper to format timestamp to HH:mm:ss
const formatTime = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-GB', { hour12: false });
};



export default function TradePage() {
  const [selectedStock, setSelectedStock] = useState(watchlistStocks[0]);
  const [orderMode, setOrderMode] = useState<'buy' | 'sell'>('buy');
  const [priceType, setPriceType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');

  const { transactions } = usePortfolioStore();

  const isBuyMode = orderMode === 'buy';
  const themeColor = isBuyMode ? 'green' : 'red';

  // Combine and sort trades
  const recentTrades = React.useMemo(() => {
    const userTrades = transactions
      .filter(t => t.ticker === selectedStock.code) // Filter by selected stock (using code as ticker for now)
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent
      .map(t => ({
        time: formatTime(t.timestamp),
        price: t.price,
        quantity: t.quantity,
        type: t.type,
        isUser: true // Flag to highlight user trades if needed
      }));

    return userTrades;
  }, [transactions, selectedStock.code]);

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">거래</h1>
            <p className="text-muted-foreground text-sm">실시간 주식 거래</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-sm">매수가능금액</span>
            <div className="text-xl font-bold text-foreground">10,000,000원</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {/* Left: Watchlist */}
        <div className="w-full lg:w-[240px] h-fit flex flex-col shrink-0 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="종목 검색..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-accent/50"
            />
          </div>
          <div className="flex-1 overflow-auto">
            {watchlistStocks.map((stock) => (
              <div
                key={stock.code}
                onClick={() => setSelectedStock(stock)}
                className={`p-3 cursor-pointer transition-all border-l-2 ${selectedStock.code === stock.code
                  ? 'bg-secondary border-accent'
                  : 'border-transparent hover:bg-secondary/50'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-foreground font-semibold text-sm">{stock.name}</div>
                    <div className="text-muted-foreground text-xs">{stock.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground font-bold text-sm">{stock.price.toLocaleString()}</div>
                    <div className={`text-xs ${stock.change.startsWith('+') ? 'text-red-500' : 'text-blue-500'}`}>
                      {stock.change}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Chart & Order Book */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 gap-4">
          {/* Stock Info Header - Now a Card */}
          <div className="bg-card border border-border rounded-2xl p-4 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedStock.name}</h2>
                  <span className="text-muted-foreground text-sm">{selectedStock.code}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-foreground">{selectedStock.price.toLocaleString()}<span className="text-muted-foreground text-lg ml-1">원</span></div>
                <div className={`px-2 py-1 rounded text-sm font-bold ${selectedStock.change.startsWith('+') ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                  ↗ {selectedStock.change}
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="flex gap-8 mt-3 text-sm">
              <div><span className="text-muted-foreground">거래량</span> <span className="text-foreground font-semibold ml-2">15,234,567</span></div>
              <div><span className="text-muted-foreground">시가</span> <span className="text-foreground font-semibold ml-2">71,000</span></div>
              <div><span className="text-muted-foreground">고가/저가</span> <span className="text-red-500 font-semibold ml-2">73,000</span> / <span className="text-blue-500 font-semibold">70,500</span></div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto flex flex-col gap-4 pr-1">
            {/* Chart Section */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-foreground font-bold">차트</span>
                <div className="flex gap-1 bg-secondary rounded-lg p-1">
                  {['1일', '5일'].map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-1 text-xs font-medium rounded-md ${tab === '1일' ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                실시간 차트 영역
              </div>
            </div>

            {/* Order Book & Recent Trades */}
            <div className="grid grid-cols-2 gap-4">
              {/* 호가 (Order Book) */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-foreground font-bold mb-3">호가</h3>
                <div className="space-y-1">
                  {/* 매도호가 (빨간색) */}
                  {orderBookAsks.slice().reverse().map((item) => (
                    <div key={item.price} className="flex justify-between text-sm py-1">
                      <span className="text-red-500 font-mono">{item.price.toLocaleString()}</span>
                      <span className="text-muted-foreground font-mono">{item.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                  {/* 현재가 */}
                  <div className="py-2 my-1 bg-secondary rounded-lg text-center">
                    <span className="text-foreground font-bold text-lg">{selectedStock.price.toLocaleString()}</span>
                  </div>
                  {/* 매수호가 (파란색) */}
                  {orderBookBids.map((item) => (
                    <div key={item.price} className="flex justify-between text-sm py-1">
                      <span className="text-blue-500 font-mono">{item.price.toLocaleString()}</span>
                      <span className="text-muted-foreground font-mono">{item.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 체결 (Recent Trades) */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-foreground font-bold mb-3">체결</h3>
                <div className="space-y-1">
                  {recentTrades.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">체결 내역이 없습니다.</div>
                  ) : (
                    recentTrades.map((trade, idx) => (
                      <div key={idx} className={`flex justify-between text-sm py-1 ${
                        // @ts-ignore
                        trade.isUser ? 'bg-accent/20 rounded px-1 -mx-1' : ''
                        }`}>
                        <span className="text-muted-foreground font-mono">{trade.time}</span>
                        <span className={`font-mono ${trade.type === 'buy' ? 'text-green-500' : 'text-blue-500'}`}>
                          {trade.price.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground font-mono">{trade.quantity.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="w-full lg:w-[280px] h-fit shrink-0">
          <OrderPanel ticker={selectedStock.code} />
        </div>
      </div>
    </div>
  );
}
