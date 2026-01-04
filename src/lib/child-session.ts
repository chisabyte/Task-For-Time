/**
 * Child Session Management
 *
 * This module manages child mode sessions to ensure strict isolation.
 * When a child profile is selected (via PIN), they are locked into child-only access.
 *
 * Session flags stored in sessionStorage:
 * - child_mode: 'true' when in child mode (child profile selected + PIN verified)
 * - active_child_id: The ID of the currently active child profile
 * - child_mode_entered_at: Timestamp when child mode was entered
 *
 * CRITICAL RULES:
 * - Child mode users can ONLY access /child/* routes
 * - Child mode users can NEVER access /parent/* routes
 * - Exiting child mode goes to /choose-profile, NOT /parent/dashboard
 * - Only explicit exit action clears child mode
 */

const CHILD_MODE_KEY = 'child_mode';
const ACTIVE_CHILD_ID_KEY = 'active_child_id';
const CHILD_MODE_ENTERED_AT_KEY = 'child_mode_entered_at';
// Legacy key - we'll migrate from this
const LEGACY_SELECTED_CHILD_ID_KEY = 'selectedChildId';

export interface ChildModeState {
    isChildMode: boolean;
    activeChildId: string | null;
    enteredAt: number | null;
}

/**
 * Enter child mode after successful PIN verification
 */
export function enterChildMode(childId: string): void {
    console.log('[ChildSession] Entering child mode for child:', childId);
    sessionStorage.setItem(CHILD_MODE_KEY, 'true');
    sessionStorage.setItem(ACTIVE_CHILD_ID_KEY, childId);
    sessionStorage.setItem(CHILD_MODE_ENTERED_AT_KEY, Date.now().toString());
    // Also set legacy key for backward compatibility during transition
    sessionStorage.setItem(LEGACY_SELECTED_CHILD_ID_KEY, childId);
}

/**
 * Exit child mode - returns to profile picker
 * Does NOT sign out the parent auth session
 */
export function exitChildMode(): void {
    console.log('[ChildSession] Exiting child mode');
    sessionStorage.removeItem(CHILD_MODE_KEY);
    sessionStorage.removeItem(ACTIVE_CHILD_ID_KEY);
    sessionStorage.removeItem(CHILD_MODE_ENTERED_AT_KEY);
    sessionStorage.removeItem(LEGACY_SELECTED_CHILD_ID_KEY);
}

/**
 * Get current child mode state
 */
export function getChildModeState(): ChildModeState {
    const isChildMode = sessionStorage.getItem(CHILD_MODE_KEY) === 'true';
    const activeChildId = sessionStorage.getItem(ACTIVE_CHILD_ID_KEY) || sessionStorage.getItem(LEGACY_SELECTED_CHILD_ID_KEY);
    const enteredAtStr = sessionStorage.getItem(CHILD_MODE_ENTERED_AT_KEY);
    const enteredAt = enteredAtStr ? parseInt(enteredAtStr, 10) : null;

    return {
        isChildMode,
        activeChildId,
        enteredAt
    };
}

/**
 * Check if currently in child mode
 */
export function isInChildMode(): boolean {
    const state = getChildModeState();
    // Child mode is active if the flag is set AND we have an active child ID
    return state.isChildMode && !!state.activeChildId;
}

/**
 * Get the active child ID (returns null if not in child mode)
 */
export function getActiveChildId(): string | null {
    const state = getChildModeState();
    if (state.isChildMode) {
        return state.activeChildId;
    }
    // Also check legacy key for backward compatibility
    return sessionStorage.getItem(LEGACY_SELECTED_CHILD_ID_KEY);
}

/**
 * Check if a route is allowed in child mode
 */
export function isRouteAllowedInChildMode(pathname: string): boolean {
    // Only /child/* routes and /choose-profile are allowed in child mode
    const allowedPrefixes = ['/child', '/choose-profile', '/login'];
    return allowedPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Check if a route requires parent access (blocked in child mode)
 */
export function isParentRoute(pathname: string): boolean {
    const parentPrefixes = ['/parent', '/dashboard', '/settings', '/admin'];
    return parentPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Get redirect URL based on child mode state
 * Used when accessing blocked routes
 */
export function getChildModeRedirect(pathname: string): string | null {
    if (!isInChildMode()) {
        return null; // Not in child mode, no redirect needed
    }

    if (isParentRoute(pathname)) {
        console.log('[ChildSession] Blocked parent route access in child mode:', pathname);
        return '/child/dashboard';
    }

    return null;
}

/**
 * Log current session state for debugging
 */
export function logSessionState(context: string, pathname?: string): void {
    const state = getChildModeState();
    console.log(`[ChildSession] ${context}:`, {
        isChildMode: state.isChildMode,
        activeChildId: state.activeChildId,
        enteredAt: state.enteredAt ? new Date(state.enteredAt).toISOString() : null,
        pathname: pathname || 'N/A',
        legacySelectedChildId: sessionStorage.getItem(LEGACY_SELECTED_CHILD_ID_KEY)
    });
}

/**
 * Migrate from legacy selectedChildId to new child mode system
 * Call this on app load to handle existing sessions
 */
export function migrateLegacySession(): void {
    const legacyChildId = sessionStorage.getItem(LEGACY_SELECTED_CHILD_ID_KEY);
    const hasNewChildMode = sessionStorage.getItem(CHILD_MODE_KEY);

    if (legacyChildId && !hasNewChildMode) {
        console.log('[ChildSession] Migrating legacy session to new child mode system');
        sessionStorage.setItem(CHILD_MODE_KEY, 'true');
        sessionStorage.setItem(ACTIVE_CHILD_ID_KEY, legacyChildId);
        sessionStorage.setItem(CHILD_MODE_ENTERED_AT_KEY, Date.now().toString());
    }
}

/**
 * Clear all session data (full logout)
 */
export function clearAllSessionData(): void {
    console.log('[ChildSession] Clearing all session data');
    sessionStorage.clear();
}
