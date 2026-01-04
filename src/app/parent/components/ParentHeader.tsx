"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParentHeaderProps {
    parentName: string;
    pendingReviewsCount: number;
}

export function ParentHeader({ parentName, pendingReviewsCount }: ParentHeaderProps) {
    const router = useRouter();
    const [showAddTask, setShowAddTask] = useState(false);

    const handleAddOpportunity = () => {
        // TODO: Open task creation modal or navigate to task creation page
        alert("Task creation feature coming soon! This will let you create new tasks for your children.");
        // For now, you could navigate to a task creation page:
        // router.push("/parent/tasks/new");
    };

    const handleGrantBonus = () => {
        // TODO: Open bonus grant modal
        alert("Bonus grant feature coming soon! This will let you give bonus time or XP to your children.");
    };

    const handleViewRewards = () => {
        // TODO: Navigate to rewards page or open rewards modal
        alert("Rewards feature coming soon! This will show all available rewards.");
        // router.push("/parent/rewards");
    };

    return (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main-light dark:text-text-main-dark">
                    Welcome back, {parentName}!
                </h1>
                <p className="text-text-sub-light dark:text-text-sub-dark text-lg">
                    The family is doing great today. <span className="text-primary-dark dark:text-primary font-semibold">{pendingReviewsCount} tasks</span> are ready for your high-five!
                </p>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-card-dark p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <button 
                    onClick={handleAddOpportunity}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-text-main-light font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Add Opportunity
                </button>
                <button 
                    onClick={handleGrantBonus}
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary/10 dark:bg-primary/20 text-teal-900 dark:text-primary font-bold text-sm rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px] fill-1">star</span>
                    Grant Bonus
                </button>
                <button 
                    onClick={handleViewRewards}
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-transparent text-text-sub-light dark:text-text-sub-dark font-medium text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    View Rewards
                </button>
            </div>
        </header>
    );
}
