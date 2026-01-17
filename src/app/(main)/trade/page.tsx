"use client";

import React, { useState } from 'react';

// Mock Data
const watchlistStocks = [
  { code: "005930", name: "삼성전자", price: 71500, change: "+2.14%" },
  { code: "000660", name: "SK하이닉스", price: 132000, change: "-1.49%" },
  { code: "035420", name: "NAVER", price: 185000, change: "+1.93%" },
  { code: "005380", name: "현대차", price: 198000, change: "-0.75%" },
  { code: "051910", name: "LG화학", price: 420000, change: "+1.94%" },
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

const recentTrades = [
  { time: "09:15:08", price: 70807, quantity: 576 },
  { time: "09:14:08", price: 72446, quantity: 589 },
  { time: "09:13:08", price: 71702, quantity: 239 },
  { time: "09:12:08", price: 71511, quantity: 191 },
  { time: "09:11:08", price: 70986, quantity: 823 },
  { time: "09:10:08", price: 71274, quantity: 111 },
  { time: "09:09:08", price: 72392, quantity: 476 },
  { time: "09:08:08", price: 71444, quantity: 264 },
];

export default function TradePage() {
  const [selectedStock, setSelectedStock] = useState(watchlistStocks[0]);
  const [orderMode, setOrderMode] = useState<'buy' | 'sell'>('buy');
  const [priceType, setPriceType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');

  const isBuyMode = orderMode === 'buy';
  const themeColor = isBuyMode ? 'green' : 'red';

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-2 pb-4 border-b border-white/5 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">거래</h1>
            <p className="text-gray-500 text-sm">실시간 주식 거래</p>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-sm">매수가능금액</span>
            <div className="text-xl font-bold text-white">10,000,000원</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Watchlist */}
        <div className="w-[240px] border-r border-white/5 flex flex-col shrink-0">
          <div className="p-3">
            <input
              type="text"
              placeholder="종목 검색..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-yellow-500/50"
            />
          </div>
          <div className="flex-1 overflow-auto">
            {watchlistStocks.map((stock) => (
              <div
                key={stock.code}
                onClick={() => setSelectedStock(stock)}
                className={`p-3 cursor-pointer transition-all border-l-2 ${selectedStock.code === stock.code
                  ? 'bg-yellow-500/10 border-yellow-500'
                  : 'border-transparent hover:bg-white/5'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-semibold text-sm">{stock.name}</div>
                    <div className="text-gray-500 text-xs">{stock.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">{stock.price.toLocaleString()}</div>
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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Stock Info Header */}
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedStock.name}</h2>
                  <span className="text-gray-500 text-sm">{selectedStock.code}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-white">{selectedStock.price.toLocaleString()}<span className="text-gray-500 text-lg ml-1">원</span></div>
                <div className={`px-2 py-1 rounded text-sm font-bold ${selectedStock.change.startsWith('+') ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                  ↗ {selectedStock.change}
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="flex gap-8 mt-3 text-sm">
              <div><span className="text-gray-500">거래량</span> <span className="text-white font-semibold ml-2">15,234,567</span></div>
              <div><span className="text-gray-500">시가</span> <span className="text-white font-semibold ml-2">71,000</span></div>
              <div><span className="text-gray-500">고가/저가</span> <span className="text-red-500 font-semibold ml-2">73,000</span> / <span className="text-blue-500 font-semibold">70,500</span></div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Chart Section */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-bold">차트</span>
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  {['1일', '5일'].map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-1 text-xs font-medium rounded-md ${tab === '1일' ? 'bg-green-500/20 text-green-400' : 'text-gray-500'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] bg-[#0a0a0c] rounded-lg flex items-center justify-center text-gray-500">
                실시간 차트 영역
              </div>
            </div>

            {/* Order Book & Recent Trades */}
            <div className="grid grid-cols-2 gap-4">
              {/* 호가 (Order Book) */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">호가</h3>
                <div className="space-y-1">
                  {/* 매도호가 (빨간색) */}
                  {orderBookAsks.slice().reverse().map((item) => (
                    <div key={item.price} className="flex justify-between text-sm py-1">
                      <span className="text-red-500 font-mono">{item.price.toLocaleString()}</span>
                      <span className="text-gray-400 font-mono">{item.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                  {/* 현재가 */}
                  <div className="py-2 my-1 bg-white/5 rounded-lg text-center">
                    <span className="text-white font-bold text-lg">{selectedStock.price.toLocaleString()}</span>
                  </div>
                  {/* 매수호가 (파란색) */}
                  {orderBookBids.map((item) => (
                    <div key={item.price} className="flex justify-between text-sm py-1">
                      <span className="text-blue-500 font-mono">{item.price.toLocaleString()}</span>
                      <span className="text-gray-400 font-mono">{item.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 체결 (Recent Trades) */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4">
                <h3 className="text-white font-bold mb-3">체결</h3>
                <div className="space-y-1">
                  {recentTrades.map((trade, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span className="text-gray-500 font-mono">{trade.time}</span>
                      <span className="text-red-500 font-mono">{trade.price.toLocaleString()}</span>
                      <span className="text-gray-400 font-mono">{trade.quantity.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="w-[280px] border-l border-white/5 flex flex-col shrink-0 p-4">
          {/* Buy/Sell Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-4">
            <button
              onClick={() => setOrderMode('buy')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${isBuyMode
                ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'text-gray-500'
                }`}
            >
              매수
            </button>
            <button
              onClick={() => setOrderMode('sell')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${!isBuyMode
                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'text-gray-500'
                }`}
            >
              매도
            </button>
          </div>

          {/* 주문 유형 */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">주문 유형</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriceType('market')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm border transition-all ${priceType === 'market'
                  ? isBuyMode
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-red-600/20 border-red-500 text-red-400'
                  : 'border-white/10 text-gray-500'
                  }`}
              >
                시장가
              </button>
              <button
                onClick={() => setPriceType('limit')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm border transition-all ${priceType === 'limit'
                  ? isBuyMode
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-red-600/20 border-red-500 text-red-400'
                  : 'border-white/10 text-gray-500'
                  }`}
              >
                지정가
              </button>
            </div>
          </div>

          {/* 수량 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-400 text-xs">수량</label>
              <span className="text-gray-500 text-xs">최대 139주</span>
            </div>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="주문 수량"
              className="w-full bg-[#1E1E24] border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-yellow-500/50 placeholder:text-sm"
            />
          </div>

          {/* Percentage Buttons */}
          <div className="flex gap-2 mb-4">
            {['25%', '50%', '75%', '100%'].map((pct) => (
              <button
                key={pct}
                className="flex-1 py-2 bg-[#1E1E24] border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10 transition-all"
              >
                {pct}
              </button>
            ))}
          </div>

          {/* 주문 총액 */}
          <div className="bg-[#1E1E24] border border-white/10 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">주문 총액</span>
              <span className="text-white font-bold text-base">0원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs">수수료 (0.015%)</span>
              <span className="text-gray-400 text-sm">0원</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className={`w-full py-2 rounded-xl font-bold text-lg transition-all ${isBuyMode
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
          >
            {isBuyMode ? '매수' : '매도'}
          </button>
        </div>
      </div>
    </div>
  );
}
