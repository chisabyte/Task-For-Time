import Link from "next/link";

export function PrivacySection() {
    return (
        <section className="space-y-6" id="privacy">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <span className="material-symbols-outlined">lock</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy &amp; Security</h2>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">How we use your data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        We believe in total transparency. Your family&apos;s data is only used to power the app features—tracking tasks and rewards. We do not sell your data to advertisers.{' '}
                        <Link href="/privacy" className="text-primary-dark dark:text-primary font-medium hover:underline">Read our full plain-English privacy policy.</Link>
                    </p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Two-Factor Authentication</h4>
                            <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Download My Data</h4>
                            <p className="text-xs text-gray-500 mt-1">Get a copy of all your family&apos;s activity logs.</p>
                        </div>
                        <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                            Request Download
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Delete Account</h4>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Permanently remove your account and all data.</p>
                </div>
                <button className="text-xs font-bold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </div>
        </section>
    );
}
