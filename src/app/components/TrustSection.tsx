export function TrustSection() {
    return (
        <section className="w-full bg-slate-900 text-white py-20">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold mb-4">Built by parents, for parents.</h2>
                    <div className="flex justify-center gap-8 text-slate-400 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">group</span>
                            <span>500+ Beta Families</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">check_circle</span>
                            <span>50,000+ Tasks Completed</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-6 border border-slate-700 max-w-lg">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">security</span>
                            Our Privacy Promise
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            We are parents too. We built this because we didn&apos;t want big tech tracking our kids.
                            <br /><br />
                            <em className="text-primary/80">&quot;Your data stays yours. We don&apos;t profit from your family&apos;s privacy.&quot;</em>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                                No location tracking
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                                No message monitoring
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                                No data selling
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                                Zero ads
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-6 border border-slate-700 max-w-lg">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">dns</span>
                            Production Ready
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Reliable, secure, and ready for your daily routine.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex justify-between items-center text-xs border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Uptime</span>
                                <span className="text-primary font-mono">99.9%</span>
                            </li>
                            <li className="flex justify-between items-center text-xs border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Security</span>
                                <span className="text-primary font-mono">Encrypted</span>
                            </li>
                            <li className="flex justify-between items-center text-xs pt-1">
                                <span className="text-slate-400">Data Control</span>
                                <span className="text-primary font-mono">Export/Delete Anytime</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
