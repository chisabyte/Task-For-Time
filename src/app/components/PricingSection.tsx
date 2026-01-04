"use client";

import { useState } from "react";
import Link from "next/link";

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(false);

    const prices = {
        premium: isYearly ? 7 : 9,
        family: isYearly ? 12 : 15
    };

    return (
        <section className="w-full py-20 bg-background-light dark:bg-background-dark" id="pricing">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-text-main dark:text-white mb-4">Simple, transparent pricing</h2>
                    <p className="text-lg text-text-sub dark:text-gray-400 mb-8">Start your free 30-day trial. No hidden fees.</p>
                    <div className="inline-flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 relative">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 rounded-md shadow-sm text-sm font-bold transition-all ${!isYearly
                                ? "bg-white dark:bg-gray-700 text-text-main dark:text-white"
                                : "text-gray-500 dark:text-gray-400 hover:text-text-main"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 rounded-md shadow-sm text-sm font-bold transition-all ${isYearly
                                ? "bg-white dark:bg-gray-700 text-text-main dark:text-white"
                                : "text-gray-500 dark:text-gray-400 hover:text-text-main"
                                }`}
                        >
                            Yearly (-20%)
                        </button>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
                        <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Basic</h3>
                        <p className="text-sm text-gray-500 mb-6">For getting started with habits.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-text-main dark:text-white">$0</span>
                            <span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                1 Child Profile
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                5 Active Tasks
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Basic Reporting
                            </li>
                        </ul>
                        <Link href="/login" className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors text-center">Start Free</Link>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-primary shadow-glow relative transform md:-translate-y-4 z-10 flex flex-col h-full">
                        <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
                            <span className="bg-primary text-teal-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">MOST POPULAR</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Premium</h3>
                        <p className="text-sm text-gray-500 mb-6">Full features for growing families.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-text-main dark:text-white">${prices.premium}</span>
                            <span className="text-gray-500">/{isYearly ? 'yr' : 'mo'}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Up to 3 Children
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Unlimited Tasks
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Advanced Analytics
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Streak Freezes
                            </li>
                        </ul>
                        <Link href="/login" className="w-full py-3 rounded-xl bg-primary text-text-main font-bold shadow-md hover:brightness-105 transition-all text-center">Start 30-Day Trial</Link>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
                        <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Family</h3>
                        <p className="text-sm text-gray-500 mb-6">Complete control for large families.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-text-main dark:text-white">${prices.family}</span>
                            <span className="text-gray-500">/{isYearly ? 'yr' : 'mo'}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-grow">
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Unlimited Profiles
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                All Premium Features
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Priority Support
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                                Parent Coaching Call
                            </li>
                        </ul>
                        <Link href="/login" className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-text-main dark:text-white font-bold hover:border-text-main dark:hover:border-white transition-colors text-center">Start Trial</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
