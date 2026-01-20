"use client";

import React, { useState, useEffect, useMemo } from 'react';
import WidgetCard from './WidgetCard';
import { Button } from '@/components/ui/Button';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useStockStore } from '@/stores/stock-store';

interface OrderPanelProps {
    ticker?: string;
}

export default function OrderPanel({ ticker: tickerProp }: OrderPanelProps) {
    // UI State
    const [tab, setTab] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [limitPrice, setLimitPrice] = useState<number>(0);
    const [qty, setQty] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        availableBalance,
        positions,
        placeOrder,
        fetchAvailableBalance,
    } = usePortfolioStore();

    const { currentQuote, fetchQuote: fetchStockQuote } = useStockStore();

    // Determine current ticker
    const ticker = tickerProp || 'AAPL'; // Default to AAPL

    // 초기 로드
    useEffect(() => {
        if (ticker) {
            fetchStockQuote(ticker).catch(() => { });
            fetchAvailableBalance().catch(() => { });
        }
    }, [ticker, fetchStockQuote, fetchAvailableBalance]);

    // Get real price from store
    const currentPrice = currentQuote?.price || 0;

    useEffect(() => {
        if (currentPrice > 0) {
            setLimitPrice(currentPrice);
        }
    }, [currentPrice]);

    // Calculate Max Buy/Sell
    const maxBuyQty = useMemo(() => {
        const price = orderType === 'market' ? currentPrice : limitPrice;
        if (price <= 0 || !availableBalance) return 0;
        return Math.floor(availableBalance / price);
    }, [availableBalance, currentPrice, limitPrice, orderType]);

    const maxSellQty = useMemo(() => {
        const position = positions.find(p => p.ticker === ticker);
        return position?.quantity || 0;
    }, [positions, ticker]);

    const handleOrder = async () => {
        const price = orderType === 'market' ? currentPrice : limitPrice;
        if (!qty || Number(qty) <= 0) {
            alert('수량을 입력해주세요.');
            return;
        }

        // 매수 시 잔고 확인
        if (tab === 'buy' && availableBalance !== null && totalAmount > availableBalance) {
            alert('잔액이 부족합니다.');
            return;
        }

        // 매도 시 보유 수량 확인
        if (tab === 'sell' && qty > maxSellQty) {
            alert('보유 수량이 부족합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            await placeOrder({
                ticker,
                type: tab === 'buy' ? 'BUY' : 'SELL',
                quantity: Number(qty),
            });
            // 주문 성공 후 수량 초기화 및 현재가 다시 불러오기
            setQty('');
            await fetchStockQuote(ticker).catch(() => { });
        } catch (error: any) {
            const errorCode = error.response?.data?.error;
            if (errorCode === 'TRADE_001') {
                alert('잔액이 부족합니다.');
            } else if (errorCode === 'TRADE_002') {
                alert('보유 수량이 부족합니다.');
            } else {
                const errorMessage = error.response?.data?.message || '주문 처리 중 오류가 발생했습니다.';
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculations
    const totalAmount = useMemo(() => {
        const price = orderType === 'market' ? (currentPrice || 0) : (limitPrice || 0);
        return price * (Number(qty) || 0);
    }, [orderType, currentPrice, limitPrice, qty]);
    const isBuy = tab === 'buy';

    return (
        <div className="bg-card border border-border rounded-3xl p-5 h-full flex flex-col shadow-sm overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-foreground font-bold text-lg">주문 (Order)</h2>
                <div className="bg-secondary rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    실시간
                </div>
            </div>

            {/* Buy/Sell Tabs */}
            <div className="flex bg-secondary p-1 rounded-2xl mb-4">
                <button
                    onClick={() => setTab('buy')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${tab === 'buy' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    매수 (Buy)
                </button>
                <button
                    onClick={() => setTab('sell')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${tab === 'sell' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    매도 (Sell)
                </button>
            </div>

            {/* Order Type Tabs (Market/Limit) */}
            <div className="flex bg-secondary p-1 rounded-xl mb-4">
                <button
                    onClick={() => setOrderType('market')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${orderType === 'market' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    시장가 (Market)
                </button>
                <button
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${orderType === 'limit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    지정가 (Limit)
                </button>
            </div>

            {/* Input Fields */}
            <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-1">
                    {/* Price Input */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1">가격 (USD)</label>
                        <div className="relative">
                            <input
                                type="number"
                                disabled={orderType === 'market'}
                                value={orderType === 'market' ? (currentPrice || 0).toFixed(2) : (limitPrice || 0).toFixed(2)}
                                onChange={(e) => setLimitPrice(Number(e.target.value))}
                                className={`w-full bg-secondary border border-border rounded-xl pl-4 pr-1 py-2 text-base font-bold outline-none transition-all ${orderType === 'market' ? 'cursor-not-allowed' : 'focus:border-accent'}`}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">USD</span>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1">수량</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full bg-secondary border border-border rounded-xl pl-4 pr-1 py-2 text-base font-bold outline-none focus:border-accent transition-all"
                            />
                            <span className="absolute right-7 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">주</span>
                        </div>
                    </div>

                    {/* Info Row */}
                    <div className="flex justify-between items-center text-xs px-1 mt-2">
                        <span className="text-muted-foreground">
                            {isBuy ? '현금 최대 가능' : '매도 가능'}
                        </span>
                        <span className="text-foreground font-bold">
                            {isBuy ? `${maxBuyQty}주` : `${maxSellQty}주`}
                        </span>
                    </div>
                    {isBuy && (
                        <div className="flex justify-between items-center text-xs px-1 mt-1">
                            <span className="text-muted-foreground">주문 가능 금액 (USD)</span>
                            <span className="text-foreground font-bold">
                                ${availableBalance !== null ? availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-2 border-t border-border space-y-2">
                    {/* Total */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">결제 금액</span>
                        <span className={`text-xl font-bold font-mono ${isBuy ? 'text-red-500' : 'text-blue-500'}`}>
                            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={handleOrder}
                        disabled={Number(qty) <= 0 || (isBuy ? Number(qty) > maxBuyQty : Number(qty) > maxSellQty) || isSubmitting}
                        className={`w-full py-1 text-sm font-bold rounded-xl shadow-lg transition-all ${isBuy
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            }`}
                    >
                        {isSubmitting ? '처리 중...' : (isBuy ? '현금 매수' : '현금 매도')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
