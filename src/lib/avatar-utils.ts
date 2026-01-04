/**
 * Avatar Utilities
 * Generates unique, colorful avatars for each child using DiceBear Avatars
 * Each child gets a unique avatar based on their ID to ensure consistency
 */

/**
 * Generate a unique avatar URL for a child
 * Uses DiceBear Avatars API with "adventurer" style (high-quality, friendly illustrations)
 * Each child gets a unique avatar based on their ID
 * 
 * @param childId - Unique child ID (UUID)
 * @param childName - Child's name (optional, used as seed fallback)
 * @param size - Avatar size in pixels (default: 128)
 * @returns Avatar URL
 */
export function getChildAvatarUrl(
  childId: string,
  childName?: string,
  size: number = 128
): string {
  // Use childId as seed to ensure consistency
  // If childId is not available, use childName as fallback
  const seed = childId || childName || 'default';

  // DiceBear Avatars API v9 - "adventurer" style (friendly, premium illustrations)
  return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Generate a unique avatar URL for a parent/adult
 * Uses "notionists" style (clean, modern, professional look)
 */
export function getParentAvatarUrl(
  userId: string,
  userName?: string,
  size: number = 128
): string {
  const seed = userId || userName || 'parent';
  return `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Generate avatar URL with "personas" style (clean, modern, friendly)
 * Alternative premium style option
 */
export function getChildAvatarUrlPersonas(
  childId: string,
  childName?: string,
  size: number = 128
): string {
  const seed = childId || childName || 'default';
  return `https://api.dicebear.com/9.x/personas/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Generate avatar URL with "big-smile" style (very kid-friendly, happy faces)
 * Best for younger children
 */
export function getChildAvatarUrlBigSmile(
  childId: string,
  childName?: string,
  size: number = 128
): string {
  const seed = childId || childName || 'default';
  return `https://api.dicebear.com/9.x/big-smile/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Get avatar URL - defaults to adventurer style for nice, premium avatars
 * Can be customized per child or globally
 */
export function getAvatarUrl(
  childId: string,
  childName?: string,
  style: 'avataaars' | 'adventurer' | 'big-smile' | 'personas' | 'notionists' = 'adventurer',
  size: number = 128
): string {
  switch (style) {
    case 'notionists':
      return getParentAvatarUrl(childId, childName, size);
    case 'personas':
      return getChildAvatarUrlPersonas(childId, childName, size);
    case 'big-smile':
      return getChildAvatarUrlBigSmile(childId, childName, size);
    case 'avataaars':
      const seed = childId || childName || 'default';
      return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    case 'adventurer':
    default:
      return getChildAvatarUrl(childId, childName, size);
  }
}

