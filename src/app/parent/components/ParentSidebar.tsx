"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { clearAllSessionData } from "@/lib/child-session";
import { AppAvatar } from "@/components/AppAvatar";

export function ParentSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userId, setUserId] = useState<string>("");
    const [userName, setUserName] = useState("Parent");
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                setUserEmail(user.email || "");
                // Get display name from profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();
                if (profile?.display_name) {
                    setUserName(profile.display_name);
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        // Clear all session data using centralized function
        clearAllSessionData();
        await supabase.auth.signOut();
        // Use window.location for full page reload to ensure clean state
        window.location.href = "/login";
    };

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-card-light dark:bg-card-dark h-screen sticky top-0">
            <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                <Link href="/parent/dashboard" className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
                    <span className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</span>
                </Link>
            </div>
            <nav className="flex-1 flex flex-col gap-2 px-4 py-6">
                <Link
                    href="/parent/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/dashboard')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">dashboard</span>
                    Dashboard
                </Link>
                <Link
                    href="/parent/approvals"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/approvals')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">task_alt</span>
                    Approvals
                </Link>
                <Link
                    href="/parent/settings"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/settings')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">family_restroom</span>
                    Family Settings
                </Link>
                <Link
                    href="/parent/tasks"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/tasks')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">menu_book</span>
                    Task Library
                </Link>
                <Link
                    href="/parent/outcomes"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/outcomes')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">track_changes</span>
                    Outcomes
                </Link>
                <Link
                    href="/parent/coaching"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/coaching')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">psychology</span>
                    AI Coaching
                </Link>
                <Link
                    href="/parent/reports"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/reports')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">assessment</span>
                    Weekly Reports
                </Link>
                <Link
                    href="/parent/analytics"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive('/parent/analytics')
                        ? 'bg-primary/20 text-teal-800 dark:text-primary font-medium'
                        : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className="material-symbols-outlined">bar_chart</span>
                    Analytics
                </Link>
            </nav>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <AppAvatar userId={userId || 'parent'} name={userName} size={40} style="notionists" />
                    <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{userName}</span>
                        <span className="text-xs text-text-sub-light dark:text-text-sub-dark truncate">{userEmail}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full mt-2 px-3 py-2 text-sm text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
