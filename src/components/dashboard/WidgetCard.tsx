"use client";

import React from "react";

interface WidgetCardProps {
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    allowOverflow?: boolean;
}

export default function WidgetCard({ title, action, children, footer, className = "", allowOverflow = false }: WidgetCardProps) {
    return (
        <div className={`bg-card border border-border rounded-2xl p-5 flex flex-col h-full ${allowOverflow ? 'overflow-visible' : 'overflow-hidden'} ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4 shrink-0">
                    {title && <h3 className="text-foreground font-bold text-lg">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={`flex-1 min-h-0 ${allowOverflow ? 'overflow-visible' : 'overflow-auto'}`}>
                {children}
            </div>
            {footer && (
                <div className="mt-4 pt-4 border-t border-border shrink-0">
                    {footer}
                </div>
            )}
        </div>
    );
}
