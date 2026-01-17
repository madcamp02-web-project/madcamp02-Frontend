"use client";

import React from 'react';
import WidgetCard from './WidgetCard';
import { Button } from '@/components/ui/Button';

export default function OrderPanel() {
    return (
        <WidgetCard
            title="주문 (Order)"
            className="h-full"
            footer={
                <div className="flex gap-3">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] h-12 text-base">
                        매수 (Buy)
                    </Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] h-12 text-base">
                        매도 (Sell)
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 pt-2">
                {/* Market Price Info */}
                <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400 text-sm">현재가 (Market Price)</span>
                    <div className="text-2xl font-bold text-white tracking-wider">$167.20</div>
                </div>

                {/* Inputs */}
                <div className="space-y-1">
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-medium ml-1">주문 가격 (Limit Price)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                className="w-full bg-[#1E1E24] border border-white/5 rounded-xl px-4 pl-8 py-2.5 text-white text-lg outline-none focus:border-yellow-500/50 focus:bg-[#25252b] transition-all font-mono font-bold"
                                defaultValue="167.20"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400 font-medium ml-1">수량 (Quantity)</label>
                        <input
                            type="number"
                            className="w-full bg-[#1E1E24] border border-white/5 rounded-xl px-4 py-2.5 text-white text-lg outline-none focus:border-yellow-500/50 focus:bg-[#25252b] transition-all font-mono font-bold"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex justify-end gap-2 text-xs text-gray-400 px-1">
                        <span>가능 수량:</span>
                        <span className="text-white font-bold">15주</span>
                    </div>


                    <div className="flex justify-between items-center px-1 mt-5 pt-5 border-t border-white/5">
                        <span className="text-sm text-gray-400">예상 금액 (Total)</span>
                        <span className="text-xl font-bold text-yellow-400 font-mono">$0.00</span>
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
}
