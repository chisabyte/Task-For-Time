import { ChildAvatar } from "@/components/ChildAvatar";

interface StatsHeroProps {
    childName: string;
    childId: string;
    level: number;
    xp: number;
}

export function StatsHero({ childName, childId, level, xp }: StatsHeroProps) {
    const nextLevelXp = level * 1000; // Simplified logic
    const progress = Math.min((xp / nextLevelXp) * 100, 100);

    return (
        <section className="bg-white dark:bg-card-dark rounded-3xl p-6 md:p-8 shadow-lg shadow-teal-900/5 border border-teal-50 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative">
                        <ChildAvatar
                            childId={childId}
                            childName={childName}
                            size={96}
                            className="border-4 border-white dark:border-gray-600 shadow-xl"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-xs font-black px-3 py-1 rounded-full shadow-md whitespace-nowrap border-2 border-white dark:border-gray-700">LVL {level}</div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-teal-900 dark:text-white">{childName}</h2>
                        <p className="text-xs font-semibold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">Next Level: Master</p>
                    </div>
                </div>
                <div className="flex-1 w-full flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <h3 className="text-lg font-bold text-teal-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary fill-1">hotel_class</span>
                            Weekly Growth
                        </h3>
                        <span className="text-sm font-bold text-primary-dark dark:text-primary">{xp} / {nextLevelXp} XP</span>
                    </div>
                    <div className="h-6 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative shadow-inner">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-teal-400 rounded-full animate-pulse" style={{ width: `${progress}%` }}></div>
                        {/* Dividers */}
                        <div className="absolute top-0 left-[33%] h-full w-0.5 bg-white/50"></div>
                        <div className="absolute top-0 left-[66%] h-full w-0.5 bg-white/50"></div>
                    </div>
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark italic">&quot;Wow! You&apos;re only {Math.max(0, nextLevelXp - xp)} XP away from a Bonus Reward!&quot;</p>
                </div>
                <div className="flex lg:flex-col gap-4 items-center shrink-0 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:block">Latest Badges</span>
                    <div className="flex gap-3">
                        <div className="group/badge relative flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                                <span className="material-symbols-outlined fill-1">school</span>
                            </div>
                            <div className="absolute opacity-0 group-hover/badge:opacity-100 bottom-full mb-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">Math Whiz</div>
                        </div>
                        <div className="group/badge relative flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center border-2 border-green-200 dark:border-green-800 shadow-sm">
                                <span className="material-symbols-outlined fill-1">compost</span>
                            </div>
                            <div className="absolute opacity-0 group-hover/badge:opacity-100 bottom-full mb-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">Eco Hero</div>
                        </div>
                        <div className="group/badge relative flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center border-2 border-purple-200 dark:border-purple-800 shadow-sm">
                                <span className="material-symbols-outlined fill-1">auto_awesome</span>
                            </div>
                            <div className="absolute opacity-0 group-hover/badge:opacity-100 bottom-full mb-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">Super Helper</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
