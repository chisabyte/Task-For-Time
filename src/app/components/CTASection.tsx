import Link from "next/link";

interface CTASectionProps {
    onOpenVideoModal: () => void;
}

export function CTASection({ onOpenVideoModal }: CTASectionProps) {
    return (
        <section className="w-full bg-primary/10 dark:bg-background-dark py-24 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-text-main dark:text-white mb-6">
                    Ready to end the arguments?
                </h2>
                <p className="text-xl text-text-sub dark:text-gray-300 mb-10">
                    Join the parents who are choosing relationship over restriction. Give your child the gift of responsibility.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/login" className="flex h-14 items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-text-main shadow-lg hover:scale-105 transition-transform">
                        Start 30-Day Free Trial
                    </Link>
                    <button onClick={onOpenVideoModal} className="flex h-14 items-center justify-center rounded-xl bg-white dark:bg-gray-800 px-8 text-lg font-bold text-text-main dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        View Demo
                    </button>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    No credit card required • Cancel anytime • Free plan available
                </p>
            </div>
        </section>
    );
}
