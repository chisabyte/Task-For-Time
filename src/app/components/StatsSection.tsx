export function StatsSection() {
    return (
        <section className="w-full bg-white dark:bg-card-dark border-y border-gray-100 dark:border-gray-800 py-10">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100 dark:divide-gray-700/50">
                    <div>
                        <p className="text-3xl lg:text-4xl font-black text-primary mb-1">2,500+</p>
                        <p className="text-sm font-medium text-text-sub dark:text-gray-400">Families Trust Us</p>
                    </div>
                    <div>
                        <p className="text-3xl lg:text-4xl font-black text-primary mb-1">50k+</p>
                        <p className="text-sm font-medium text-text-sub dark:text-gray-400">Tasks Completed Daily</p>
                    </div>
                    <div>
                        <p className="text-3xl lg:text-4xl font-black text-primary mb-1">87%</p>
                        <p className="text-sm font-medium text-text-sub dark:text-gray-400">Report Less Conflict</p>
                    </div>
                    <div>
                        <p className="text-3xl lg:text-4xl font-black text-primary mb-1">4.9/5</p>
                        <p className="text-sm font-medium text-text-sub dark:text-gray-400">Average App Rating</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
