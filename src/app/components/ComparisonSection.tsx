export function ComparisonSection() {
    return (
        <section className="w-full bg-background-light dark:bg-background-dark py-20 border-t border-gray-100 dark:border-gray-800" id="comparison">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-text-main dark:text-white sm:text-4xl mb-4">Choose your approach</h2>
                    <p className="text-lg text-text-sub dark:text-gray-400">Control creates rebels. Trust creates partners.</p>
                </div>
                <div className="overflow-x-auto mb-16 rounded-2xl shadow-card border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-bold text-base w-1/4">Feature</th>
                                <th className="px-6 py-4 font-bold text-base text-primary bg-primary/5 w-1/4 border-x border-primary/10">Task For Time</th>
                                <th className="px-6 py-4 font-bold text-base w-1/6">ScreenCoach</th>
                                <th className="px-6 py-4 font-bold text-base w-1/6">Apple Screen Time</th>
                                <th className="px-6 py-4 font-bold text-base w-1/6">Qustodio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            <tr>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Trust-Based Approach</td>
                                <td className="px-6 py-4 text-center bg-primary/5 border-x border-primary/10"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-yellow-500">warning</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Privacy First (No Spying)</td>
                                <td className="px-6 py-4 text-center bg-primary/5 border-x border-primary/10"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-yellow-500">warning</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Forgiving Streaks</td>
                                <td className="px-6 py-4 text-center bg-primary/5 border-x border-primary/10"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Web-Only Access</td>
                                <td className="px-6 py-4 text-center bg-primary/5 border-x border-primary/10"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-red-500">cancel</span></td>
                                <td className="px-6 py-4 text-center"><span className="material-symbols-outlined text-primary">check_circle</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Pricing</td>
                                <td className="px-6 py-4 text-center bg-primary/5 border-x border-primary/10 font-bold text-primary">Affordable</td>
                                <td className="px-6 py-4 text-center text-gray-500">High</td>
                                <td className="px-6 py-4 text-center text-gray-500">Free</td>
                                <td className="px-6 py-4 text-center text-gray-500">Medium</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 opacity-80">
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined">phonelink_lock</span>
                            Traditional Control Apps
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-red-400 text-xl">block</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-gray-300">Total Lockdown</strong>
                                    <span className="text-sm text-gray-500">Phone becomes a brick. Child finds workarounds immediately.</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-red-400 text-xl">visibility</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-gray-300">Invasive Spying</strong>
                                    <span className="text-sm text-gray-500">Reading texts and tracking location breaks the parent-child bond.</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-red-400 text-xl">gavel</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-gray-300">Punitive Logic</strong>
                                    <span className="text-sm text-gray-500">&quot;If you mess up, you lose everything.&quot; Demotivating.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 relative shadow-glow">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="bg-primary text-teal-950 text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">diversity_3</span>
                            Task For Time
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-primary text-xl">task_alt</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-white">Agreements & Habits</strong>
                                    <span className="text-sm text-text-sub dark:text-gray-400">Child completes tasks to unlock time. Focus is on *earning*.</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-primary text-xl">shield_person</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-white">Privacy Preserved</strong>
                                    <span className="text-sm text-text-sub dark:text-gray-400">We don&apos;t track location or read messages. Trust is the engine.</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1"><span className="material-symbols-outlined text-primary text-xl">restart_alt</span></div>
                                <div>
                                    <strong className="block text-text-main dark:text-white">Forgiving Streaks</strong>
                                    <span className="text-sm text-text-sub dark:text-gray-400">Miss a day? Streaks pause, they don&apos;t reset. We celebrate effort.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
