"use client";

import React from "react";
// Widget Imports (Placeholders for now)
import AssetChart from "@/components/dashboard/AssetChart";
import OrderPanel from "@/components/dashboard/OrderPanel";
import Watchlist from "@/components/dashboard/Watchlist";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import RecentTrades from "@/components/dashboard/RecentTrades";
import PersonaRanking from "@/components/dashboard/PersonaRanking";

// Dashboard Main Page
export default function DashboardPage() {
    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.8fr_0.7fr] gap-4 h-full p-2">
                {/* Column 1 (Left) */}
                <div className="flex flex-col gap-2 h-full min-w-0">
                    {/* Top: Chart */}
                    <div className="flex-[1.3] min-h-[300px]">
                        <AssetChart />
                    </div>
                    {/* Bottom: Total Asset & Portfolio */}
                    <div className="flex-1 min-h-[250px]">
                        <PortfolioSummary />
                    </div>
                </div>

                {/* Column 2 (Middle) */}
                <div className="flex flex-col gap-6 h-full min-w-0">
                    {/* Top: Buy/Sell */}
                    <div className="flex-1 min-h-[350px]">
                        <OrderPanel />
                    </div>
                    {/* Bottom: Persona & Ranking (Merged) */}
                    <div className="flex-[1.2] min-h-[300px]">
                        <PersonaRanking />
                    </div>
                </div>

                {/* Column 3 (Right) */}
                <div className="flex flex-col gap-6 h-full min-w-0">
                    {/* Top: Watchlist */}
                    <div className="flex-1 min-h-[250px]">
                        <Watchlist />
                    </div>
                    {/* Bottom: Recent Trades */}
                    <div className="flex-1 min-h-[300px]">
                        <RecentTrades />
                    </div>
                </div>
            </div>
        </div>
    );
}
