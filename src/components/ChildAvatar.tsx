import { AppAvatar, AvatarStyle } from "./AppAvatar";

interface ChildAvatarProps {
    childId: string;
    childName: string;
    size?: number;
    className?: string;
    /**
     * Avatar style - defaults to 'adventurer' for children
     * Use 'notionists' for parent accounts
     */
    style?: AvatarStyle;
}

/**
 * ChildAvatar Component
 * Wraps AppAvatar for backward compatibility and convenience.
 * Defaults to 'adventurer' style for child-friendly illustrations.
 */
export function ChildAvatar({
    childId,
    childName,
    size = 64,
    className = "",
    style = 'adventurer'
}: ChildAvatarProps) {
    return (
        <AppAvatar
            userId={childId}
            name={childName}
            size={size}
            className={className}
            style={style}
        />
    );
}
