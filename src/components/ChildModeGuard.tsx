"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isInChildMode, isParentRoute, getChildModeRedirect, logSessionState } from "@/lib/child-session";

interface ChildModeGuardProps {
    children: React.ReactNode;
}

/**
 * ChildModeGuard - Client-side route protection for child mode
 *
 * This component blocks access to parent routes when in child mode.
 * It must wrap any layout or page that needs protection.
 *
 * When child mode is active:
 * - /parent/* routes are blocked → redirect to /child/dashboard
 * - /dashboard routes are blocked → redirect to /child/dashboard
 * - /settings routes are blocked → redirect to /child/dashboard
 * - /admin routes are blocked → redirect to /child/dashboard
 */
export function ChildModeGuard({ children }: ChildModeGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        // Log session state for debugging
        logSessionState('ChildModeGuard check', pathname);

        // Check if we're in child mode and trying to access a parent route
        if (isInChildMode() && isParentRoute(pathname)) {
            console.log('[ChildModeGuard] BLOCKED - Child mode user attempting to access parent route:', pathname);
            setIsBlocked(true);

            // Redirect to child dashboard
            const redirectUrl = getChildModeRedirect(pathname) || '/child/dashboard';
            router.replace(redirectUrl);
            return;
        }

        setIsBlocked(false);
        setIsChecking(false);
    }, [pathname, router]);

    // Show nothing while checking or if blocked (prevents flash of parent content)
    if (isChecking || isBlocked) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    {isBlocked && (
                        <p className="text-sm text-gray-500">Redirecting...</p>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
