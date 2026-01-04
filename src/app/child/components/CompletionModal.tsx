"use client";

interface CompletionModalProps {
    onClose: () => void;
    taskTitle: string;
    rewardMinutes: number;
    childName: string;
}

export function CompletionModal({ onClose, taskTitle, rewardMinutes, childName }: CompletionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-teal-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-card-dark rounded-[2rem] shadow-2xl overflow-hidden transform transition-all scale-100 p-8 text-center border border-white/20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-12 left-8 text-yellow-400">
                    <span className="material-symbols-outlined text-2xl fill-1 rotate-[-15deg]">star</span>
                </div>
                <div className="absolute top-8 right-12 text-primary">
                    <span className="material-symbols-outlined text-xl rotate-[30deg]">celebration</span>
                </div>
                <div className="absolute bottom-32 right-6 text-purple-400">
                    <span className="material-symbols-outlined text-lg fill-1 rotate-[12deg]">pentagon</span>
                </div>
                <div className="absolute bottom-20 left-6 text-blue-400">
                    <span className="material-symbols-outlined text-xl rotate-[-45deg]">favorite</span>
                </div>
                <div className="absolute top-20 right-20 w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="absolute top-16 left-24 w-2 h-2 bg-blue-400 rotate-45"></div>
                <div className="absolute bottom-40 right-10 w-2 h-4 bg-green-400 rotate-12"></div>
                <div className="relative mx-auto mb-6 h-28 w-28 flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-100 dark:bg-green-500/20 rounded-full animate-pulse"></div>
                    <div className="relative h-24 w-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                        <span className="material-symbols-outlined text-5xl text-white font-bold">check</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full shadow-md border-2 border-white dark:border-gray-800 transform rotate-12">
                        Yay!
                    </div>
                </div>
                <h2 className="text-3xl font-black text-teal-900 dark:text-white mb-2 tracking-tight">Great job, {childName}!</h2>
                <p className="text-lg text-text-sub-light dark:text-text-sub-dark font-medium mb-8 leading-relaxed">
                    You completed <br /><span className="text-teal-900 dark:text-white font-bold text-xl">{taskTitle}</span>
                </p>
                <div className="bg-gradient-to-br from-teal-50 to-white dark:from-gray-800 dark:to-gray-800/50 border border-teal-100 dark:border-gray-700 rounded-2xl p-4 mb-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-center gap-4 relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary-dark dark:text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl fill-1">bolt</span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-text-sub-light dark:text-text-sub-dark font-bold uppercase tracking-wider">Reward Earned</p>
                            <p className="text-2xl font-black text-teal-900 dark:text-white">+{rewardMinutes} Minutes</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl mb-8 border border-blue-100 dark:border-blue-900/30">
                    <span className="material-symbols-outlined text-blue-500 text-xl mt-0.5">mark_email_read</span>
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Parent Notified</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">We sent a notification to your parent for approval. Keep up the great work!</p>
                    </div>
                </div>
                <button className="w-full py-4 bg-primary hover:bg-primary-dark text-teal-900 font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 text-base flex items-center justify-center gap-2 group" onClick={onClose}>
                    Back to My Dashboard
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
