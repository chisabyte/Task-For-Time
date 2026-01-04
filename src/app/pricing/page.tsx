import Link from "next/link";
import { FooterSection } from "../components/FooterSection";

export default function PricingPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
                            <h2 className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</h2>
                        </Link>
                        <Link href="/" className="text-sm font-medium text-primary hover:underline">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-text-main dark:text-white mb-4">Pricing</h1>
                    <p className="text-lg text-text-sub dark:text-gray-300">
                        Simple, transparent pricing for families
                    </p>
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border-2 border-primary shadow-lg max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-block px-4 py-2 bg-primary/20 text-primary font-bold rounded-full text-sm mb-4">
                            BETA - FREE DURING BETA
                        </div>
                        <h2 className="text-3xl font-black text-text-main dark:text-white mb-2">Free Beta</h2>
                        <p className="text-2xl font-bold text-primary mb-4">$0/month</p>
                        <p className="text-text-sub dark:text-gray-300">
                            Task For Time is currently in beta and completely free to use.
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                            <div>
                                <p className="font-bold text-text-main dark:text-white">Unlimited children</p>
                                <p className="text-sm text-text-sub dark:text-gray-400">Add as many children as you need</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                            <div>
                                <p className="font-bold text-text-main dark:text-white">Unlimited tasks</p>
                                <p className="text-sm text-text-sub dark:text-gray-400">Assign as many tasks as you want</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                            <div>
                                <p className="font-bold text-text-main dark:text-white">Full feature access</p>
                                <p className="text-sm text-text-sub dark:text-gray-400">All features available during beta</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                            <div>
                                <p className="font-bold text-text-main dark:text-white">Priority support</p>
                                <p className="text-sm text-text-sub dark:text-gray-400">Help us improve by sharing feedback</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>Beta Status:</strong> Task For Time is in active development. Features may change, 
                            and occasional bugs or interruptions may occur. Your feedback helps us build a better product.
                        </p>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/signup"
                            className="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-teal-900 font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-lg"
                        >
                            Get Started Free
                        </Link>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            No credit card required. No hidden fees.
                        </p>
                    </div>
                </div>

                <div className="mt-12 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-text-main dark:text-white mb-6 text-center">
                        Future Pricing
                    </h3>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            After the beta period, Task For Time will introduce pricing. We're committed to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-text-sub dark:text-gray-300">
                            <li>Keeping a free tier for small families</li>
                            <li>Transparent, simple pricing (no hidden fees)</li>
                            <li>Grandfathering beta users with special pricing</li>
                            <li>No surprise charges or auto-renewal without consent</li>
                        </ul>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            Beta users will be notified at least 30 days before any pricing changes take effect.
                        </p>
                    </div>
                </div>

                <div className="mt-12 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-text-main dark:text-white mb-6 text-center">
                        Questions?
                    </h3>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Have questions about pricing or the beta program?
                        </p>
                        <a
                            href="mailto:support@taskfortime.com"
                            className="inline-block px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-main dark:text-white font-bold rounded-lg transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}

