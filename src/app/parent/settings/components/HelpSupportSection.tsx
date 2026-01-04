import Link from "next/link";

export function HelpSupportSection() {
    return (
        <section className="space-y-6" id="help">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                    <span className="material-symbols-outlined">help</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help &amp; Support</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/help/user-guide" className="block p-5 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">menu_book</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">User Guide</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Learn how to set up tasks and rewards effectively.</p>
                </Link>
                <a 
                    href="mailto:roscoechisas@gmail.com?subject=Task%20For%20Time%20Support&body=Describe%20your%20issue%20here..." 
                    className="block p-5 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-colors group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">Contact Support</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Need help? Our team is here for you.</p>
                </a>
            </div>
        </section>
    );
}
