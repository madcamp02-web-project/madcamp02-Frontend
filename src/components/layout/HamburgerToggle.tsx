"use client";

import React from "react";
import { useUIStore } from "@/stores/ui-store";

export default function HamburgerToggle() {
    const { toggleSidebar } = useUIStore();

    return (
        <button
            onClick={toggleSidebar}
            suppressHydrationWarning
            style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M7 4h8" />
                <path d="M7 7h8" />
                <path d="M7 10h8" />
            </svg>
        </button>
    );
}
