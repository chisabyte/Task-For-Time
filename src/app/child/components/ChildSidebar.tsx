"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { exitChildMode, clearAllSessionData, isInChildMode, getActiveChildId } from "@/lib/child-session";
import { ChildAvatar } from "@/components/ChildAvatar";
import { AppAvatar } from "@/components/AppAvatar";

interface ChildSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function ChildSidebar({ isOpen, onClose }: ChildSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [childName, setChildName] = useState("Child");
    const [childId, setChildId] = useState<string | null>(null);
    const [childLevel, setChildLevel] = useState(1);
    // CRITICAL: Default to false - only show "Exit Child View" when explicitly confirmed as parent
    const [isParentViewing, setIsParentViewing] = useState(false);
    // Track the actual user role from database to prevent any mismatches
    const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);

    useEffect(() => {
        const fetchChild = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('[ChildSidebar] No authenticated user');
                return;
            }

            // First, check if the current user is a parent
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            console.log('[ChildSidebar] User profile:', profile, 'Error:', profileError);

            // CRITICAL: Store the role from database - this is the source of truth
            const dbRole = profile?.role;
            setUserRole(dbRole || null);

            // If there's no profile or the role is explicitly 'child', this is a real child user
            // Real child users should NEVER see "Exit Child View"
            if (!profile || dbRole === 'child') {
                console.log('[ChildSidebar] Real child user detected (role from DB:', dbRole, ')');

                // Clear any stale selectedChildId - real children don't need this
                const staleSelectedChildId = sessionStorage.getItem('selectedChildId');
                if (staleSelectedChildId) {
                    console.log('[ChildSidebar] Clearing stale selectedChildId for real child user');
                    sessionStorage.removeItem('selectedChildId');
                }

                // Fetch child profile by auth_user_id
                const { data: child } = await supabase
                    .from('children')
                    .select('id, name, level')
                    .eq('auth_user_id', user.id)
                    .single();

                if (child) {
                    setChildName(child.name);
                    setChildId(child.id);
                    setChildLevel(child.level);
                    console.log('[ChildSidebar] Real child user:', child.name);
                }

                // CRITICAL: Force isParentViewing to false for real child users
                setIsParentViewing(false);
                return;
            }

            // Only check for parent-viewing-as-child if the user is confirmed as a parent
            if (dbRole === 'parent') {
                const selectedChildId = sessionStorage.getItem('selectedChildId');
                console.log('[ChildSidebar] Parent detected, selectedChildId:', selectedChildId);

                if (selectedChildId) {
                    // Parent viewing as a specific child
                    const { data: child, error: childError } = await supabase
                        .from('children')
                        .select('id, name, level')
                        .eq('id', selectedChildId)
                        .single();

                    if (child && !childError) {
                        setChildName(child.name);
                        setChildId(child.id);
                        setChildLevel(child.level);
                        setIsParentViewing(true);
                        console.log('[ChildSidebar] Parent viewing as child:', child.name);
                    } else {
                        // Invalid selectedChildId - clear it and redirect to parent dashboard
                        console.log('[ChildSidebar] Invalid selectedChildId, clearing and redirecting');
                        sessionStorage.removeItem('selectedChildId');
                        router.push("/parent/dashboard");
                    }
                } else {
                    // Parent without selectedChildId shouldn't be on child dashboard
                    // But let's not auto-redirect, just show parent info
                    console.log('[ChildSidebar] Parent without selectedChildId on child page');
                    setIsParentViewing(false);
                }
            }
        };
        fetchChild();
    }, [router]);

    const handleExitChildMode = () => {
        console.log('[ChildSidebar] Exiting Child Mode - returning to profile picker');
        // Use the centralized exit function - goes to profile picker, NOT parent dashboard
        exitChildMode();
        // CRITICAL: Go to login page (profile picker), never to parent dashboard
        // This ensures child mode users can't accidentally access parent content
        router.push("/login");
    };

    const handleLogout = async () => {
        console.log('[ChildSidebar] Logging out...');
        // Use centralized session clearing
        clearAllSessionData();

        // Sign out from Supabase and wait for completion
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('[ChildSidebar] Logout error:', error);
        }

        // Use window.location for a full page reload to ensure clean state
        // This prevents any cached auth state from causing redirect issues
        window.location.href = "/login";
    };

    const isActive = (path: string) => pathname === path;

    // Log button decision for debugging
    console.log('[ChildSidebar] Button decision:', {
        userRole,
        isParentViewing,
        showExitChildView: userRole === 'parent' && isParentViewing,
        showSignOut: !(userRole === 'parent' && isParentViewing)
    });

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-6 border-b border-teal-50 dark:border-gray-800">
                <Link href="/child/dashboard" className="flex items-center gap-2" onClick={onClose}>
                    <span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
                    <span className="text-lg font-bold tracking-tight text-text-main-light dark:text-white uppercase tracking-tighter">Task For Time</span>
                </Link>
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 text-text-sub-light dark:text-text-sub-dark">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>
            <nav className="flex-1 flex flex-col gap-3 px-4 py-6">
                <Link
                    href="/child/dashboard"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold ${isActive('/child/dashboard')
                        ? 'bg-primary/20 text-teal-900 dark:text-primary shadow-sm'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-teal-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined fill-1">space_dashboard</span>
                    My Dashboard
                </Link>
                <Link
                    href="/child/dashboard"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-text-sub-light dark:text-text-sub-dark hover:bg-teal-50 dark:hover:bg-gray-800 group`}
                >
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">check_circle</span>
                    My Tasks
                </Link>
            </nav>
            <div className="p-6 border-t border-teal-50 dark:border-gray-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-gray-800/50 border border-teal-100 dark:border-gray-700 mb-3">
                    {childId ? (
                        <ChildAvatar
                            childId={childId}
                            childName={childName}
                            size={40}
                            className="border-2 border-primary"
                        />
                    ) : (
                        <AppAvatar userId="default" name={childName} size={40} className="border-2 border-primary" />
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-teal-900 dark:text-white">{childName}</span>
                        <span className="text-xs text-text-sub-light dark:text-text-sub-dark">Level {childLevel}</span>
                    </div>
                </div>
                {userRole === 'parent' && isParentViewing && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg text-center font-medium mb-2">
                        Viewing as {childName}
                    </div>
                )}
                {userRole === 'parent' && isParentViewing ? (
                    <button
                        onClick={handleExitChildMode}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Exit Child Mode
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r border-teal-100 dark:border-gray-800 bg-card-light dark:bg-card-dark h-screen sticky top-0">
                {sidebarContent}
            </aside>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Sidebar */}
                <aside
                    className={`absolute top-0 left-0 w-80 h-full bg-card-light dark:bg-card-dark shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {sidebarContent}
                </aside>
            </div>
        </>
    );
}
