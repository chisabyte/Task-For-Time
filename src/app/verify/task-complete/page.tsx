"use client";

import { ChildSidebar } from "../../child/components/ChildSidebar";
import { StatsHero } from "../../child/components/StatsHero";
import { TaskColumn } from "../../child/components/TaskColumn";
import { TimeAndRewardsColumn } from "../../child/components/TimeAndRewardsColumn";
import { CompletionModal } from "../../child/components/CompletionModal";

export default function VerifyTaskCompletion() {
    // Mock Data
    const child = {
        name: "Leo",
        level: 4,
        xp: 850,
        time_bank_minutes: 135
    };

    // Assuming we want to show the MODAL overlay as per the flow?
    // Or just the page?
    // Structure suggests it's the dashboard with a modal.
    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
            <ChildSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
                        <span className="font-bold">Task For Time</span>
                    </div>
                </div>
                {/* Simplified content for background */}
                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                                Hi {child.name}! 🚀
                            </h1>
                        </div>
                    </header>
                    <StatsHero childName={child.name} childId="mock-id" level={child.level} xp={child.xp} />
                </div>

                {/* The Completion Modal */}
                <CompletionModal
                    onClose={() => { }}
                    taskTitle="Make Your Bed"
                    rewardMinutes={15}
                    childName={child.name}
                />
            </main>
        </div>
    );
}
