export function PsychologySection() {
    return (
        <section className="w-full bg-white dark:bg-background-dark py-20 border-t border-gray-100 dark:border-gray-800" id="why-it-works">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-widest mb-6">
                        The Psychology
                    </div>
                    <h2 className="text-3xl font-bold text-text-main dark:text-white mb-6">
                        Why trust works better than control
                    </h2>
                </div>
                <div className="w-full max-w-5xl mx-auto mb-16 rounded-xl overflow-hidden shadow-card border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-12 items-stretch justify-center relative">
                        <div className="flex-1 flex flex-col items-center relative z-10 group">
                            <div className="mb-6 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 ring-4 ring-red-50 dark:ring-red-900/20">
                                    <span className="material-symbols-outlined text-3xl text-red-500">gavel</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Control Model</h3>
                                <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mt-1">The Old Way</p>
                            </div>
                            <div className="flex flex-col gap-4 w-full max-w-xs relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -translate-x-1/2 -z-10 dashed-line"></div>
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-gray-400 mb-2">lock</span>
                                    <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">Restrict & Block</p>
                                </div>
                                <div className="text-center text-gray-300 dark:text-gray-600"><span className="material-symbols-outlined">arrow_downward</span></div>
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-gray-400 mb-2">visibility_off</span>
                                    <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">Monitor Secretly</p>
                                </div>
                                <div className="text-center text-gray-300 dark:text-gray-600"><span className="material-symbols-outlined">arrow_downward</span></div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-red-500 mb-2">warning</span>
                                    <p className="font-bold text-red-700 dark:text-red-300 text-sm">Resistance & Escalation</p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col justify-center items-center relative z-10">
                            <div className="h-full w-px bg-gray-200 dark:bg-gray-700 absolute"></div>
                            <div className="bg-white dark:bg-gray-800 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-400 relative z-20">VS</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center relative z-10">
                            <div className="mb-6 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 ring-4 ring-primary/10 shadow-glow">
                                    <span className="material-symbols-outlined text-3xl text-primary">handshake</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trust Model</h3>
                                <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Task For Time</p>
                            </div>
                            <div className="flex flex-col gap-4 w-full max-w-xs relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/30 -translate-x-1/2 -z-10"></div>
                                <div className="bg-white dark:bg-card-dark p-4 rounded-lg border border-primary/20 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-primary mb-2">list_alt</span>
                                    <p className="font-medium text-text-main dark:text-white text-sm">Clear Expectations</p>
                                </div>
                                <div className="text-center text-primary/50"><span className="material-symbols-outlined">arrow_downward</span></div>
                                <div className="bg-white dark:bg-card-dark p-4 rounded-lg border border-primary/20 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-primary mb-2">check_circle</span>
                                    <p className="font-medium text-text-main dark:text-white text-sm">Task Completion & Approval</p>
                                </div>
                                <div className="text-center text-primary/50"><span className="material-symbols-outlined">arrow_downward</span></div>
                                <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 shadow-md text-center transform transition-transform hover:scale-105">
                                    <span className="material-symbols-outlined text-primary mb-2">sentiment_satisfied</span>
                                    <p className="font-bold text-teal-900 dark:text-primary text-sm">Responsibility & Consistency</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="text-lg text-text-sub dark:text-gray-400 mb-6">
                            Traditional blocking apps trigger <strong>psychological reactance</strong>—when freedom is threatened, kids naturally rebel.
                        </p>
                        <p className="text-lg text-text-sub dark:text-gray-400 mb-8">
                            Task For Time flips the script using <strong>positive reinforcement</strong>. When kids &quot;earn&quot; their time, they value it more, argue less, and learn to self-regulate.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-red-500">lock</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main dark:text-white">The Old Way (Control)</h4>
                                    <p className="text-sm text-gray-500">Parent is the &quot;Warden&quot;. Kid feels powerless. Result: Secrets & Hacks.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">handshake</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main dark:text-white">The New Way (Trust)</h4>
                                    <p className="text-sm text-gray-500">Parent is the &quot;Guide&quot;. Kid feels capable. Result: Cooperation.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 relative z-10">
                            <h3 className="font-bold text-center text-gray-400 uppercase tracking-widest text-xs mb-8">The Dopamine Loop</h3>
                            <div className="flex flex-col gap-2 relative">
                                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-4 border-gray-100 dark:border-gray-600 flex items-center justify-center text-xl shadow-sm z-10">🧹</div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 flex-1">
                                        <span className="text-sm font-bold dark:text-white">Action:</span> <span className="text-sm text-gray-500">Complete a task</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-4 border-primary dark:border-primary flex items-center justify-center text-xl shadow-sm z-10">✨</div>
                                    <div className="bg-primary/10 p-3 rounded-lg shadow-sm border border-primary/20 flex-1">
                                        <span className="text-sm font-bold text-teal-900 dark:text-white">Reward:</span> <span className="text-sm text-teal-800 dark:text-teal-200">Earn minutes immediately</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-4 border-gray-100 dark:border-gray-600 flex items-center justify-center text-xl shadow-sm z-10">🎮</div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 flex-1">
                                        <span className="text-sm font-bold dark:text-white">Result:</span> <span className="text-sm text-gray-500">Guilt-free play</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-full h-full bg-primary/5 rounded-2xl -z-0"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
