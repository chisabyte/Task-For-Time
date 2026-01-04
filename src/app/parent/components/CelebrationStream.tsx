"use client";

import { useRouter } from "next/navigation";

type CelebrationItem = {
    id: string;
    child_name: string;
    task_title: string;
    reward_minutes: number;
    reviewed_at: string;
};

interface CelebrationStreamProps {
    celebrations: CelebrationItem[];
}

export function CelebrationStream({ celebrations }: CelebrationStreamProps) {
    const router = useRouter();

    const handleViewHistory = () => {
        router.push("/parent/approvals");
    };
    return (
        <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 fill-1">celebration</span>
                    Celebration Stream
                </h2>
                <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-8">
                    {celebrations.length === 0 ? (
                        <p className="text-sm text-gray-500">No recent activity.</p>
                    ) : (
                        celebrations.map(item => (
                            <div key={item.id} className="relative">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-card-dark"></div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-text-main-light dark:text-text-main-dark leading-snug">
                                        <span className="font-bold">{item.child_name}</span> completed {item.task_title}!
                                    </p>
                                    <span className="text-xs font-bold text-primary">+{item.reward_minutes} mins earned</span>
                                    <span className="text-[10px] text-text-sub-light dark:text-text-sub-dark mt-1">
                                        {new Date(item.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button 
                    onClick={handleViewHistory}
                    className="w-full mt-8 py-2 text-sm text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                >
                    View Full History
                </button>
            </div>
        </aside>
    );
}
