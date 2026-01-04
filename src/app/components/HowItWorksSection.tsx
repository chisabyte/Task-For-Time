export function HowItWorksSection() {
    return (
        <section className="w-full py-16 bg-background-light dark:bg-background-dark" id="how-it-works">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white">How the system works</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined text-3xl">add_task</span>
                        </div>
                        <h3 className="font-bold text-text-main dark:text-white">1. Create Tasks</h3>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined text-3xl">touch_app</span>
                        </div>
                        <h3 className="font-bold text-text-main dark:text-white">2. Kid Reports</h3>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined text-3xl">verified</span>
                        </div>
                        <h3 className="font-bold text-text-main dark:text-white">3. You Approve</h3>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined text-3xl">trending_up</span>
                        </div>
                        <h3 className="font-bold text-text-main dark:text-white">4. Balance Grows</h3>
                    </div>
                </div>
                <div className="text-center mt-10">
                    <a className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-bold text-sm transition-colors group" href="#">
                        Watch it in action
                        <span className="group-hover:translate-x-1 transition-transform">▶️</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
