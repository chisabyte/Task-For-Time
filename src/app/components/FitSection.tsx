export function FitSection() {
    return (
        <section className="w-full py-20 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800" id="fit">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-text-main dark:text-white sm:text-4xl mb-4">Is this right for your family?</h2>
                    <p className="text-lg text-text-sub dark:text-gray-400">We built this for parents who want to raise adults, not inmates.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 dark:bg-gray-800/20 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-red-400 text-3xl">cancel</span>
                            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">This is NOT for you if...</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-red-400 text-lg shrink-0">close</span>
                                You want to read your child&apos;s private messages.
                            </li>
                            <li className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-red-400 text-lg shrink-0">close</span>
                                You believe in punishing mistakes by wiping progress.
                            </li>
                            <li className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-red-400 text-lg shrink-0">close</span>
                                You want a &quot;set it and forget it&quot; digital jail.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
                            <h3 className="text-xl font-bold text-text-main dark:text-white">This IS for you if...</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-text-main dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg shrink-0">check</span>
                                You value open conversation over hidden surveillance.
                            </li>
                            <li className="flex gap-3 text-sm text-text-main dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg shrink-0">check</span>
                                You want your child to learn time management skills.
                            </li>
                            <li className="flex gap-3 text-sm text-text-main dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg shrink-0">check</span>
                                You are willing to trust them to report their own tasks.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
