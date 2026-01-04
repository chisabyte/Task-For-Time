"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type AvatarStyle = 'adventurer' | 'notionists' | 'avataaars' | 'personas' | 'big-smile';

interface AppAvatarProps {
    userId: string;
    name?: string;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
    /**
     * DiceBear avatar style:
     * - 'adventurer': friendly cartoon illustrations (default for children)
     * - 'notionists': clean, modern, professional (default for parents)
     * - 'avataaars': classic cartoon avatars
     * - 'personas': clean, modern, friendly
     * - 'big-smile': very kid-friendly happy faces
     */
    style?: AvatarStyle;
}

/**
 * AppAvatar Component
 *
 * One reusable avatar component for the entire app.
 * - If avatarUrl is provided, it uses that.
 * - Otherwise, generates a deterministic DiceBear avatar based on userId.
 * - Style can be customized: 'adventurer' for children, 'notionists' for parents.
 * - Ensures visual consistency (circle, border).
 */
export function AppAvatar({
    userId,
    name = "User",
    avatarUrl,
    size = 44,
    className = "",
    style = 'adventurer'
}: AppAvatarProps) {
    const [imageError, setImageError] = useState(false);

    // Deterministic DiceBear URL using the specified style
    // Using pastel background colors to fit any theme
    const diceBearUrl = useMemo(() => {
        const seed = encodeURIComponent(userId);
        const bgColors = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
        // Use v9.x for best quality and PNG format for better compatibility
        return `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=${Math.max(size * 2, 128)}&backgroundColor=${bgColors}`;
    }, [userId, style, size]);

    // Use custom URL if available and hasn't error'd, otherwise fallback to DiceBear
    const src = (avatarUrl && !imageError) ? avatarUrl : diceBearUrl;

    return (
        <div
            className={`relative rounded-full overflow-hidden border-2 border-white/20 shadow-sm bg-gray-100 dark:bg-gray-800 ${className}`}
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={name || "User avatar"}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes={`${size}px`}
                unoptimized
            />
        </div>
    );
}
