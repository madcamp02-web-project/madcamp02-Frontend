"use client";

import React from 'react';
import { GachaResponse } from '@/types/api';

interface GachaResultModalProps {
    result: GachaResponse;
    onClose: () => void;
}

const rarityColors: Record<string, string> = {
    COMMON: "bg-gray-500",
    RARE: "bg-blue-500",
    EPIC: "bg-purple-500",
    LEGENDARY: "bg-yellow-500",
};

const rarityLabels: Record<string, string> = {
    COMMON: "Common",
    RARE: "Rare",
    EPIC: "Epic",
    LEGENDARY: "Legendary",
};

export default function GachaResultModal({ result, onClose }: GachaResultModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-4">가챠 결과</h2>
                    <div className="mb-4">
                        {result.imageUrl ? (
                            <img src={result.imageUrl} alt={result.name} className="w-32 h-32 mx-auto object-contain" />
                        ) : (
                            <div className="w-32 h-32 mx-auto bg-secondary rounded-lg flex items-center justify-center text-6xl">
                                🎁
                            </div>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{result.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded text-sm text-white ${rarityColors[result.rarity]}`}>
                        {rarityLabels[result.rarity]}
                    </span>
                    <div className="mt-4 text-muted-foreground text-sm">
                        남은 코인: {(result.remainingCoin ?? 0).toLocaleString()}
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
