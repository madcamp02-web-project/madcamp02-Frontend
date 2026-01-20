"use client";

import React, { useState, useEffect, useMemo } from 'react';
import OrderPanel from '@/components/dashboard/OrderPanel';
import TradeChart from '@/components/trade/TradeChart';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useStockStore } from '@/stores/stock-store';
import { socketClient } from '@/lib/api/socket-client';

// Helper to format timestamp to HH:mm:ss
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', { hour12: false });
};

export default function TradePage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<string>('d'); // 기본값: d (일봉)
  const [orderMode, setOrderMode] = useState<'buy' | 'sell'>('buy');
  const [priceType, setPriceType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');

  const { 
    watchlist, 
    orderbook, 
    currentQuote, 
    candles,
    searchResults,
    prices,
    isLoading,
    error,
    loadWatchlist, 
    fetchOrderbook, 
    fetchQuote,
    fetchCandles,
    searchStocks,
    addToWatchlist,
    removeFromWatchlist,
    updatePrice,
    updateQuoteFromWebSocket,
    updateQuoteFromWebSocketMessage,
    addRealtimeTrade,
  } = useStockStore();

  const { 
    transactions, 
    availableBalance,
    fetchAvailableBalance,
    fetchHistory,
  } = usePortfolioStore();

  // 초기 로드
  useEffect(() => {
    loadWatchlist().catch(() => {});
    fetchAvailableBalance().catch(() => {});
    fetchHistory().catch(() => {});
  }, [loadWatchlist, fetchAvailableBalance, fetchHistory]);

  // 관심종목 목록이 로드되면 WebSocket 구독만 설정
  // 백엔드 StockSubscriptionManager가 활성 구독을 추적하고,
  // StockQuoteBroadcastService가 5초마다 활성 구독 종목의 Quote 데이터를 브로드캐스트하므로
  // 초기 API 호출 없이 WebSocket만으로 데이터 수신 가능

  // 선택된 종목이 변경되면 관련 데이터 fetch
  // 차트 데이터와 호가 데이터는 API로 가져오되, 가격 정보는 WebSocket으로 수신
  useEffect(() => {
    if (selectedTicker) {
      console.log(`[TradePage] 종목 선택됨: ${selectedTicker}`);
      
      // 호가 데이터는 API로 가져오기 (WebSocket으로는 실시간 업데이트 안 됨)
      // 에러는 store에서 조용히 처리하므로 여기서는 별도 처리 불필요
      fetchOrderbook(selectedTicker).catch(() => {
        // 조용히 실패 처리 (store에서 이미 처리됨)
      });
      
      // 차트 데이터는 API로 가져오기
      fetchCandles(selectedTicker, timeframe).then((result) => {
        console.log(`[TradePage] fetchCandles 성공 (${timeframe}):`, result);
      }).catch((err) => {
        console.error('[TradePage] fetchCandles failed:', err);
      });
      
      // 가격 정보는 WebSocket으로 수신하므로 초기 API 호출은 선택적
      // WebSocket 구독이 이미 설정되어 있으면 백엔드가 자동으로 Quote 데이터 브로드캐스트
      // 초기 표시를 위해 한 번만 호출 (캐시된 데이터가 있으면 사용)
      if (!prices[selectedTicker] || prices[selectedTicker].price === 0) {
        fetchQuote(selectedTicker).catch((err) => {
          console.error('[TradePage] fetchQuote failed (WebSocket으로 대체):', err);
        });
      }
    }
  }, [selectedTicker, timeframe, fetchOrderbook, fetchCandles, fetchQuote, prices]);

  // WebSocket 구독: 관심종목 전체에 대한 실시간 가격 업데이트
  useEffect(() => {
    if (watchlist.length === 0) return;

    const subscriptions: Array<{ ticker: string; subscription: any }> = [];

    const setupSubscriptions = async () => {
      // 연결이 안 되어 있으면 연결 시도
      if (!socketClient.isConnected()) {
        // WebSocket 연결 실패 시에도 조용히 처리 - 재연결 시도
        await socketClient.connect().catch((error) => {
          // 에러는 조용히 처리 - 백그라운드에서 재연결 시도
          console.error('[STOMP] Connection failed (재연결 시도):', error);
          return;
        });
      }

      // 관심종목 전체에 대해 WebSocket 구독
      for (const ticker of watchlist) {
        const destination = `/topic/stock.ticker.${ticker}`;
        const subscription = await socketClient.subscribe(destination, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log(`[TradePage] WebSocket 실시간 데이터 수신 (${ticker}):`, data);
            
            const messageTicker = data.ticker || ticker;
            const rawType = data.rawType || 'trade'; // "trade" 또는 "quote"
            
            // Quote 메시지 처리 (백엔드 Quote API 폴링 데이터 - 5초마다)
            // 백엔드 StockQuoteBroadcastService가 활성 구독 종목의 OHLC 데이터를 브로드캐스트
            if (rawType === 'quote') {
              console.log(`[TradePage] Quote 메시지 수신 (${messageTicker}):`, {
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close,
                previousClose: data.previousClose,
                change: data.change,
                changePercent: data.changePercent,
                volume: data.volume,
              });
              
              // Quote 메시지의 모든 필드를 currentQuote에 반영 (선택된 종목인 경우)
              // prices에도 반영하여 관심종목 목록에 표시
              updateQuoteFromWebSocketMessage(messageTicker, data);
            } 
            // Trade 메시지 처리 (실시간 체결 데이터)
            // 백엔드 TradePriceBroadcastService가 Finnhub WebSocket trade 메시지를 브로드캐스트
            else {
              const price = data.price || data.close || 0;
              const volume = data.volume || 0;
              const timestamp = data.ts || Date.now();
              
              // 실시간 trade 데이터가 있으면 차트용으로 저장
              if (volume > 0) {
                addRealtimeTrade(messageTicker, price, volume, timestamp);
              }
              
              // currentQuote 업데이트 (선택된 종목인 경우)
              // prices도 업데이트하여 관심종목 목록에 실시간 반영
              updateQuoteFromWebSocket(messageTicker, price, volume, timestamp);
              
              // prices 업데이트 (관심종목 목록 표시용)
              updatePrice({
                ticker: messageTicker,
                price,
                change: 0, // change는 updateQuoteFromWebSocket에서 계산됨
                changePercent: 0, // changePercent도 updateQuoteFromWebSocket에서 계산됨
                volume,
                timestamp,
              });
            }
          } catch (error) {
            console.error(`[TradePage] Failed to parse WebSocket message for ${ticker}:`, error);
          }
        });
        
        if (subscription) {
          subscriptions.push({ ticker, subscription });
        }
      }
    };

    setupSubscriptions();

    return () => {
      // 모든 구독 해제
      subscriptions.forEach(({ ticker, subscription }) => {
        if (subscription) {
          socketClient.unsubscribe(`/topic/stock.ticker.${ticker}`);
        }
      });
    };
  }, [watchlist, updatePrice, updateQuoteFromWebSocket, updateQuoteFromWebSocketMessage, addRealtimeTrade]);

  // 첫 번째 관심종목을 기본 선택
  useEffect(() => {
    if (watchlist.length > 0 && !selectedTicker) {
      setSelectedTicker(watchlist[0]);
    }
  }, [watchlist, selectedTicker]);

  // 검색 기능
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.trim()) {
      await searchStocks(keyword).catch(() => {});
    } else {
      // 검색어가 비어있으면 검색 결과 초기화
      // searchResults는 store에서 관리되므로 별도 초기화 불필요
    }
  };
  
  // 종목 선택 시 검색 결과에서 종목명 가져오기
  useEffect(() => {
    if (selectedTicker && !searchResults) {
      // 종목이 선택되었는데 검색 결과가 없으면 검색 시도 (종목명 가져오기)
      searchStocks(selectedTicker).catch(() => {});
    }
  }, [selectedTicker, searchResults, searchStocks]);

  // 관심종목 추가/삭제
  const handleToggleWatchlist = async (ticker: string, isInWatchlist: boolean) => {
    if (isInWatchlist) {
      await removeFromWatchlist(ticker).catch(() => {});
    } else {
      await addToWatchlist(ticker).catch(() => {});
    }
  };

  // 현재 선택된 종목 정보 (실시간 업데이트 반영)
  const selectedStock = useMemo(() => {
    if (!selectedTicker) return null;
    
    // currentQuote가 있으면 우선 사용 (실시간 업데이트 반영)
    // 없으면 prices에서 가져오기
    const priceData = currentQuote && currentQuote.ticker === selectedTicker 
      ? currentQuote 
      : prices[selectedTicker];
    
    if (!priceData) return null;
    
    // 종목명 찾기: searchResults에서 찾거나 currentQuote의 ticker 사용
    let stockName = selectedTicker;
    if (searchResults?.items) {
      const found = searchResults.items.find(item => item.symbol === selectedTicker);
      if (found) {
        stockName = found.name;
      }
    }
    
    return {
      ticker: selectedTicker,
      name: stockName,
      price: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
    };
  }, [selectedTicker, prices, currentQuote, searchResults]);

  // 관심종목 목록 (가격 정보 포함) - WebSocket 실시간 업데이트 반영
  const watchlistStocks = useMemo(() => {
    return watchlist.map(ticker => {
      // prices에서 가격 정보 가져오기 (WebSocket으로 실시간 업데이트됨)
      // 백엔드 StockQuoteBroadcastService가 5초마다 Quote 데이터 브로드캐스트
      const price = prices[ticker];
      
      // 가격 정보가 없으면 currentQuote 확인 (선택된 종목인 경우)
      let priceValue = price?.price;
      let changePercent = price?.changePercent ?? 0;
      
      // prices에 데이터가 없고, 선택된 종목이면 currentQuote 사용
      if ((priceValue === undefined || priceValue === 0) && currentQuote && currentQuote.ticker === ticker) {
        priceValue = currentQuote.price;
        changePercent = currentQuote.changePercent ?? 0;
      }
      
      // 가격 정보가 있으면 표시, 없으면 기본값 표시 (WebSocket 데이터 대기)
      const hasPrice = priceValue !== undefined && priceValue !== null && priceValue > 0;
      
      return {
        ticker,
        name: ticker, // API에서 이름을 가져올 수 있으면 추가
        price: hasPrice ? priceValue : null,
        change: hasPrice ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : '--',
        changePercent: changePercent,
      };
    });
  }, [watchlist, prices, currentQuote]);

  // Combine and sort trades
  const recentTrades = useMemo(() => {
    if (!selectedTicker) return [];
    
    const userTrades = [...transactions]
      .filter(t => t.ticker === selectedTicker)
      .sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime())
      .map(t => ({
        time: formatTime(t.tradeDate),
        price: t.price,
        quantity: t.quantity,
        type: t.type.toLowerCase() as 'buy' | 'sell',
        isUser: true
      }));

    return userTrades;
  }, [transactions, selectedTicker]);

  // 에러 상태는 표시하지 않음 - WebSocket으로 실시간 데이터 수신

  if (!selectedStock) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">종목을 선택해주세요</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto" suppressHydrationWarning>
      {/* Header */}
      <div className="px-4 pt-2 pb-4 border-b border-border shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">거래</h1>
            <p className="text-muted-foreground text-sm">실시간 주식 거래</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-sm">매수가능금액</span>
            <div className="text-xl font-bold text-foreground">
              {availableBalance !== null 
                ? `$${availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : '로딩 중...'}
            </div>
          </div>
        </div>
      </div>

      {/* 에러 알림 제거 - WebSocket으로 실시간 데이터 수신 */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {/* Left: Watchlist */}
        <div className="w-full lg:w-[240px] h-fit flex flex-col shrink-0 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="종목 검색..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-accent/50"
            />
            {searchKeyword && searchResults && (
              <div className="mt-2 max-h-48 overflow-auto bg-background border border-border rounded-lg">
                {searchResults.items.map((item, index) => {
                  const isInWatchlist = watchlist.includes(item.symbol);
                  // symbol과 index를 조합하여 고유한 key 생성
                  const uniqueKey = `${item.symbol}-${index}`;
                  return (
                    <div
                      key={uniqueKey}
                      className="p-2 hover:bg-secondary cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setSelectedTicker(item.symbol);
                        setSearchKeyword('');
                      }}
                    >
                      <div>
                        <div className="text-foreground font-medium text-sm">{item.name}</div>
                        <div className="text-muted-foreground text-xs">{item.symbol}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatchlist(item.symbol, isInWatchlist);
                        }}
                        className="text-xs px-2 py-1 rounded bg-accent/20 text-accent"
                      >
                        {isInWatchlist ? '제거' : '추가'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {watchlistStocks.length > 0 ? watchlistStocks.map((stock, index) => (
              <div
                key={`watchlist-${stock.ticker}-${index}`}
                onClick={() => setSelectedTicker(stock.ticker)}
                className={`p-3 cursor-pointer transition-all border-l-2 ${selectedTicker === stock.ticker
                  ? 'bg-secondary border-accent'
                  : 'border-transparent hover:bg-secondary/50'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-foreground font-semibold text-sm">{stock.name}</div>
                    <div className="text-muted-foreground text-xs">{stock.ticker}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground font-bold text-sm">
                      ${stock.price !== null && stock.price > 0 
                        ? stock.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                        : '--'}
                    </div>
                    <div className={`text-xs ${stock.change?.startsWith('+') ? 'text-green-500' : stock.change?.startsWith('-') ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {stock.change || '--'}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                관심종목이 없습니다. 검색하여 추가해주세요.
              </div>
            )}
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
                  <span className="text-muted-foreground text-sm">{selectedStock.ticker}</span>
                  {searchResults?.items.find(item => item.symbol === selectedTicker)?.exchange && (
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {searchResults.items.find(item => item.symbol === selectedTicker)?.exchange}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-foreground">
                  ${(selectedStock.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                {selectedStock.changePercent !== undefined && (
                  <div className={`px-2 py-1 rounded text-sm font-bold ${selectedStock.changePercent >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {selectedStock.changePercent >= 0 ? '↗' : '↘'} {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
            {/* Stats - WebSocket 실시간 업데이트 반영 (데이터 없으면 -- 표시) */}
            <div className="flex gap-8 mt-3 text-sm flex-wrap">
              {/* 시가(Open) - 실시간 업데이트 */}
              <div>
                <span className="text-muted-foreground">시가(Open)</span>
                <span className="text-foreground font-semibold ml-2">
                  {currentQuote?.open !== undefined && currentQuote.open > 0
                    ? `$${currentQuote.open.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '--'}
                </span>
              </div>
              {/* 고가(High) - 실시간 업데이트 */}
              <div>
                <span className="text-muted-foreground">고가(High)</span>
                <span className="text-green-500 font-semibold ml-2">
                  {currentQuote?.high !== undefined && currentQuote.high > 0
                    ? `$${currentQuote.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '--'}
                </span>
              </div>
              {/* 저가(Low) - 실시간 업데이트 */}
              <div>
                <span className="text-muted-foreground">저가(Low)</span>
                <span className="text-red-500 font-semibold ml-2">
                  {currentQuote?.low !== undefined && currentQuote.low > 0
                    ? `$${currentQuote.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '--'}
                </span>
              </div>
              {/* 종가(Close) - 실시간 업데이트 (현재가와 동일) */}
              <div>
                <span className="text-muted-foreground">종가(Close)</span>
                <span className="text-foreground font-semibold ml-2">
                  {currentQuote?.price !== undefined && currentQuote.price > 0
                    ? `$${currentQuote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '--'}
                </span>
              </div>
              {/* 전일가(Prev) - WebSocket으로 실시간 업데이트 */}
              <div>
                <span className="text-muted-foreground">전일가(Prev)</span>
                <span className="text-muted-foreground font-semibold ml-2">
                  {currentQuote?.previousClose !== undefined && currentQuote.previousClose > 0
                    ? `$${currentQuote.previousClose.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : '--'}
                </span>
              </div>
              {/* 거래량(Vol) - 실시간 업데이트 */}
              <div>
                <span className="text-muted-foreground">거래량(Vol)</span>
                <span className="text-foreground font-semibold ml-2">
                  {currentQuote?.volume !== undefined && currentQuote.volume > 0 
                    ? currentQuote.volume.toLocaleString() 
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto flex flex-col gap-4 pr-1">
            {/* Chart Section */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-foreground font-bold">차트</span>
                <div className="flex gap-1 bg-secondary rounded-lg p-1">
                  {[
                    { label: 'D', value: 'd', description: '일봉' },
                    { label: 'W', value: 'w', description: '주봉' },
                    { label: 'M', value: 'm', description: '월봉' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setTimeframe(tab.value);
                        // timeframe 변경 시 useEffect가 자동으로 fetchCandles 호출하므로 중복 호출 제거
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        timeframe === tab.value 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {selectedTicker ? (
                <TradeChart 
                  ticker={selectedTicker} 
                  timeframe={timeframe}
                />
              ) : (
                <div className="h-[300px] bg-background rounded-lg flex items-center justify-center text-muted-foreground">
                  종목을 선택해주세요
                </div>
              )}
            </div>

            {/* Order Book & Recent Trades */}
            <div className="grid grid-cols-2 gap-4">
              {/* 호가 (Order Book) */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-foreground font-bold mb-3">호가</h3>
                <div className="space-y-1">
                  {orderbook ? (
                    <>
                      {/* 매도호가 (빨간색) */}
                      {orderbook.asks.slice().reverse().map((item, idx) => (
                        <div key={`ask-${idx}-${item.price}`} className="flex justify-between text-sm py-1">
                          <span className="text-red-500 font-mono">${(item.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span className="text-muted-foreground font-mono">{(item.quantity ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                      {/* 현재가 */}
                      <div className="py-2 my-1 bg-secondary rounded-lg text-center">
                        <span className="text-foreground font-bold text-lg">${(selectedStock.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      {/* 매수호가 (파란색) */}
                      {orderbook.bids.map((item, idx) => (
                        <div key={`bid-${idx}-${item.price}`} className="flex justify-between text-sm py-1">
                          <span className="text-blue-500 font-mono">${(item.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span className="text-muted-foreground font-mono">{(item.quantity ?? 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm">호가 데이터를 불러오는 중...</div>
                  )}
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
                          {(trade.price ?? 0).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground font-mono">{(trade.quantity ?? 0).toLocaleString()}</span>
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
          <OrderPanel ticker={selectedStock.ticker} />
        </div>
      </div>
    </div>
  );
}
