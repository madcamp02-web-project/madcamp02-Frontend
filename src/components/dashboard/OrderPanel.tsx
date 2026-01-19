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
    const [qty, setQty] = useState<number>(0);

    const { cash, holdings, buyStock, sellStock } = usePortfolioStore();

    // Determine current ticker
    const ticker = tickerProp || 'AAPL'; // Default to AAPL
    const isKRW = ['005930', '000660', '035420', '005380', '051910'].includes(ticker);
    const currencySymbol = isKRW ? '원' : 'USD';
    const EXCHANGE_RATE = 1430;

    // Get real price from store or fallback
    const { prices } = useStockStore();
    const currentPrice = prices[ticker]?.price || (ticker === 'AAPL' ? 167.20 : 71500); // Fallback: AAPL $167, Samsung 71500

    useEffect(() => {
        setLimitPrice(currentPrice);
    }, [currentPrice]);

    // Calculate Max Buy/Sell
    const maxBuyQty = useMemo(() => {
        const price = orderType === 'market' ? currentPrice : limitPrice;
        if (price <= 0) return 0;

        // Cash is USD. If stock is KRW, convert cash to KRW buying power.
        const buyingPower = isKRW ? cash * EXCHANGE_RATE : cash;
        return Math.floor(buyingPower / price);
    }, [cash, currentPrice, limitPrice, orderType, isKRW]);

    const maxSellQty = holdings[ticker]?.quantity || 0;

    const handleOrder = () => {
        const price = orderType === 'market' ? currentPrice : limitPrice;
        if (qty <= 0) return;

        if (tab === 'buy') {
            buyStock(ticker, price, qty);
        } else {
            sellStock(ticker, price, qty);
        }
        // Reset qty after order
        setQty(0);
    };

    // Calculations
    const totalAmount = (orderType === 'market' ? currentPrice : limitPrice) * qty;
    const isBuy = tab === 'buy';

    return (
        <div className="bg-card border border-border rounded-3xl p-5 h-full flex flex-col shadow-sm overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-foreground font-bold text-lg">주문 (Order)</h2>
                <div className="bg-secondary rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    실시간/Mock
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
                        <label className="text-xs text-muted-foreground ml-1">가격 ({isKRW ? 'KRW' : 'USD'})</label>
                        <div className="relative">
                            <input
                                type="number"
                                disabled={orderType === 'market'}
                                value={orderType === 'market' ? currentPrice : limitPrice}
                                onChange={(e) => setLimitPrice(Number(e.target.value))}
                                className={`w-full bg-secondary border border-border rounded-xl pl-4 pr-1 py-2 text-base font-bold outline-none transition-all ${orderType === 'market' ? 'cursor-not-allowed' : 'focus:border-accent'}`}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1">수량</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={qty}
                                onChange={(e) => setQty(Number(e.target.value))}
                                placeholder="0"
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
                            <span className="text-foreground font-bold">${cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
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
                        disabled={Number(qty) <= 0 || (isBuy ? Number(qty) > maxBuyQty : Number(qty) > maxSellQty)}
                        className={`w-full py-1 text-sm font-bold rounded-xl shadow-lg transition-all ${isBuy
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            }`}
                    >
                        {isBuy ? '현금 매수' : '현금 매도'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
