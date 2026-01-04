import Link from "next/link";

export function FooterSection() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 py-12">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">diversity_3</span>
                        <span className="font-bold text-sm text-text-main dark:text-white">Task For Time</span>
                    </div>
                    <div className="flex gap-8 text-sm text-text-sub dark:text-gray-500">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                        <a href="mailto:support@taskfortime.com" className="hover:text-primary transition-colors">Contact</a>
                    </div>
                    <div className="text-sm text-gray-400">
                        © <span>{currentYear}</span> Task For Time.
                    </div>
                </div>
            </div>
        </footer>
    );
}
