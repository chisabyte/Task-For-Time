export function FAQSection() {
    return (
        <section className="w-full py-20 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-text-main dark:text-white mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-text-sub dark:text-gray-400">Everything you need to know about the product.</p>
                </div>
                <div className="space-y-4">
                    <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Does this app block other apps?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            No, Task For Time focuses on habit building and trust, not system-level blocking. We believe in agreements, not technical force.
                        </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Can I monitor my child&apos;s messages?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Absolutely not. We are privacy-first. We do not track location, read messages, or spy on your child.
                        </div>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">How does the &quot;Streak&quot; feature work?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            If a child misses a day, we &quot;freeze&quot; the streak rather than resetting it to zero. This encourages them to pick back up without feeling discouraged.
                        </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Is there a free trial?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Yes! Every plan comes with a 30-day free trial, no credit card required upfront.
                        </div>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Can I use this on multiple devices?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Yes, Task For Time is a web app that works on any device with a browser—phones, tablets, and desktops.
                        </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">What happens if I cancel?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            You can export your data anytime. Upon cancellation, your account will remain active until the end of the billing period.
                        </div>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Is my data secure?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Yes, we use bank-level encryption (AES-256) and are fully COPPA compliant to ensure children&apos;s data safety.
                        </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Can I customize tasks?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Yes, you can create custom tasks for anything—chores, homework, reading, or even &apos;positive attitude&apos;.
                        </div>
                    </details>
                    <details className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Does it work for teenagers?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            It&apos;s designed primarily for ages 6-14, but many parents find it effective for establishing boundaries with older teens too.
                        </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                            <h3 className="font-bold text-text-main dark:text-white">Is there an offline mode?</h3>
                            <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="px-6 pb-6 text-text-sub dark:text-gray-300 text-sm leading-relaxed">
                            Currently, an internet connection is required to sync approvals and tasks in real-time.
                        </div>
                    </details>
                </div>
                <div className="text-center mt-12">
                    <p className="text-text-sub dark:text-gray-400">Still have questions? <a className="text-primary font-bold hover:underline" href="#">Contact us</a></p>
                </div>
            </div>
        </section>
    );
}
