"use client";

import React from "react";

interface WidgetCardProps {
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export default function WidgetCard({ title, action, children, footer, className = "" }: WidgetCardProps) {
    return (
        <div className={`bg-[#0F0F12] border border-white/10 rounded-2xl p-5 flex flex-col h-full overflow-hidden ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4 shrink-0">
                    {title && <h3 className="text-white font-bold text-lg">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="flex-1 overflow-auto scrollbar-hide">
                {children}
            </div>
            {footer && (
                <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                    {footer}
                </div>
            )}
        </div>
    );
}
