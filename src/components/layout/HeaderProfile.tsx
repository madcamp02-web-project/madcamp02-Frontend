"use client";

import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import Image from "next/image";

export default function HeaderProfile() {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated || !user) {
        return null;
    }

    // 닉네임 첫 글자 (fallback용)
    const avatarText = user.nickname ? user.nickname.charAt(0) : "👤";
    // 프로필 이미지 URL
    const profileImage = user.profileImage;

    return (
        <Link
            href="/mypage"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
        >
            {profileImage ? (
                <Image
                    src={profileImage}
                    alt={user.nickname || "프로필"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover"
                />
            ) : (
                <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-sm font-bold text-background">
                    {avatarText}
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">
                    {user.nickname || "사용자"}
                </span>
            </div>
        </Link>
    );
}
