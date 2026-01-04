"use client";

import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import { ChildAvatar } from "@/components/ChildAvatar";

type Child = Database['public']['Tables']['children']['Row'];

export interface ChildWithStats extends Child {
    pendingReviewsCount: number;
    activeTasksCount: number;
    completedTasksCount: number;
}

interface ChildrenOverviewProps {
    childrenData: ChildWithStats[];
    onAddChild?: () => void;
}

export function ChildrenOverview({ childrenData, onAddChild }: ChildrenOverviewProps) {
    const router = useRouter();
    
    // Debug: Log received data
    console.log('[ChildrenOverview] Received childrenData:', childrenData.map(c => ({
        name: c.name,
        pendingReviewsCount: c.pendingReviewsCount,
        activeTasksCount: c.activeTasksCount,
        completedTasksCount: c.completedTasksCount
    })));

    const handleReview = (childId: string) => {
        router.push("/parent/approvals");
    };

    return (
        <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">groups</span>
                    Children Overview
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark">updated just now</span>
                    {onAddChild && (
                        <button
                            onClick={onAddChild}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Child
                        </button>
                    )}
                </div>
            </div>
            {childrenData.length === 0 ? (
                <div className="p-8 text-center bg-card-light dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">child_care</span>
                    <p className="text-gray-500 mb-4">No children added yet.</p>
                    {onAddChild && (
                        <button
                            onClick={onAddChild}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-text-main-light font-bold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Your First Child
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {childrenData.map(child => {
                        const hours = Math.floor(child.time_bank_minutes / 60);
                        const minutes = child.time_bank_minutes % 60;

                        console.log(`[ChildCard RENDER] ${child.name} (ID: ${child.id})`);
                        console.log(`[ChildCard RENDER] ${child.name}: pending=${child.pendingReviewsCount}, active=${child.activeTasksCount}, completed=${child.completedTasksCount}`);

                        return (
                            <article key={child.id} className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 items-center">
                                        <div className="relative">
                                            <ChildAvatar
                                                childId={child.id}
                                                childName={child.name}
                                                size={64}
                                                className="border-2 border-primary"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">LVL {child.level}</div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">{child.name}</h3>
                                            <p className="text-sm text-text-sub-light dark:text-text-sub-dark flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-gray-400"></span> {child.xp} XP
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider mb-1">Time Bank</p>
                                        <p className="text-3xl font-black text-primary tracking-tight">{hours}h {minutes}m</p>
                                    </div>
                                </div>
                                
                                {/* Active Tasks Section */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                                            Active Tasks
                                        </span>
                                        <span className="bg-white dark:bg-background-dark text-xs font-bold px-2 py-1 rounded text-blue-700 dark:text-blue-300">{child.activeTasksCount} Active</span>
                                    </div>
                                    {child.activeTasksCount > 0 ? (
                                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                                            {child.activeTasksCount} task{child.activeTasksCount !== 1 ? 's' : ''} assigned and waiting for {child.name} to complete
                                        </p>
                                    ) : (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                            No active tasks assigned
                                        </p>
                                    )}
                                </div>

                                {/* Ready for Review Section */}
                                <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/10 dark:border-primary/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-teal-900 dark:text-primary flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">verified</span>
                                            Ready for Review
                                        </span>
                                        <span className="bg-white dark:bg-background-dark text-xs font-bold px-2 py-1 rounded text-teal-800 dark:text-teal-200">{child.pendingReviewsCount} Items</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {child.pendingReviewsCount > 0 ? (
                                            <div className="flex items-center justify-between bg-white dark:bg-background-dark/50 p-2 rounded border border-primary/10">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">pending</span>
                                                    <span className="text-sm font-medium">Tasks waiting...</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleReview(child.id)}
                                                    className="text-xs bg-primary text-text-main-light px-3 py-1.5 rounded font-bold hover:bg-primary-dark transition cursor-pointer"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center bg-white dark:bg-background-dark/50 p-2 rounded border border-primary/10">
                                                <span className="text-sm text-gray-500">All caught up!</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
