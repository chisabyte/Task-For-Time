"use client";

import { ChildSidebar } from "../../child/components/ChildSidebar";
import { StatsHero } from "../../child/components/StatsHero";
import { TaskColumn } from "../../child/components/TaskColumn";
import { TimeAndRewardsColumn } from "../../child/components/TimeAndRewardsColumn";

export default function VerifyChildDashboard() {
    // Mock Data matching Child Dashboard.html
    const child = {
        name: "Leo",
        level: 4,
        xp: 850,
        time_bank_minutes: 135
    };

    const tasks = [
        {
            id: "1",
            title: "Make Your Bed",
            description: "Make sure corners are tucked in tight!",
            category: "Morning",
            reward_minutes: 15,
            family_id: "mock",
            requires_approval: true,
            active: true,
            created_at: ""
        },
        {
            id: "2",
            title: "Read 20 Minutes",
            description: "Pick your favorite adventure book.",
            category: "Learning",
            reward_minutes: 20,
            family_id: "mock",
            requires_approval: true,
            active: true,
            created_at: ""
        },
        {
            id: "3",
            title: "Walk the Dog",
            description: "Take Buster around the block twice.",
            category: "Home", // HTML didn't specify category text but had icon
            reward_minutes: 30,
            family_id: "mock",
            requires_approval: true,
            active: true,
            created_at: ""
        }
    ];

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
                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                                Hi {child.name}! 🚀
                            </h1>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                                You have <span className="text-primary-dark dark:text-primary font-bold">{tasks.length} new opportunities</span> to earn stars today!
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-dark text-text-sub-light dark:text-text-sub-dark text-sm font-bold rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:text-primary">
                            <span className="material-symbols-outlined text-[20px]">palette</span>
                            Customize Theme
                        </button>
                    </header>

                    <StatsHero
                        childName={child.name}
                        childId="mock-id"
                        level={child.level}
                        xp={child.xp}
                    />

                    <div className="flex flex-col lg:flex-row gap-8">
                        <TaskColumn
                            tasks={tasks}
                            completedCount={0}
                            onComplete={() => { }}
                        />
                        <TimeAndRewardsColumn
                            timeBankMinutes={child.time_bank_minutes}
                            childId="mock-child-id"
                            onRedeem={() => { }}
                            rewards={[
                                {
                                    id: "r1",
                                    family_id: "mock",
                                    title: "1 Hour Gaming",
                                    cost_minutes: 60,
                                    icon: "videogame_asset",
                                    status: "available",
                                    created_at: ""
                                },
                                {
                                    id: "r2",
                                    family_id: "mock",
                                    title: "Movie Night Pick",
                                    cost_minutes: 120,
                                    icon: "movie",
                                    status: "available",
                                    created_at: ""
                                }
                            ]}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
