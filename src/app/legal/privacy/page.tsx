import Link from "next/link";
import { FooterSection } from "../../components/FooterSection";

export default function PrivacyPolicyPage() {
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
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-black text-text-main dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-sm text-text-sub dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">1. Information We Collect</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Task For Time collects the following information to provide our service:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li><strong>Account Information:</strong> Email address, password (hashed), display name</li>
                            <li><strong>Family Data:</strong> Family name, children's names, avatars (optional)</li>
                            <li><strong>Task Data:</strong> Tasks assigned, completion status, timestamps</li>
                            <li><strong>Progress Data:</strong> Experience points (XP), levels, time bank balances</li>
                            <li><strong>Reward Data:</strong> Rewards created and redeemed</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">2. How We Use Your Information</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We use your information solely to:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Provide and maintain the Task For Time service</li>
                            <li>Enable task management and approval workflows</li>
                            <li>Track progress and calculate rewards</li>
                            <li>Send service-related notifications (if enabled)</li>
                            <li>Improve our service based on usage patterns</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">3. Children's Privacy (COPPA Compliance)</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Task For Time is designed for families and complies with COPPA (Children's Online Privacy Protection Act):
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>We do not knowingly collect personal information from children under 13 without parental consent</li>
                            <li>All child accounts are created and managed by parents</li>
                            <li>Parents have full control over their children's data</li>
                            <li>Parents can delete their child's account and data at any time</li>
                            <li>We do not share children's information with third parties</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">4. Data Storage & Security</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Your data is stored securely:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Data is stored in Supabase (PostgreSQL database) with encryption at rest</li>
                            <li>All API communications use HTTPS encryption</li>
                            <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
                            <li>Row-level security policies ensure data isolation between families</li>
                            <li>We implement industry-standard security measures</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">5. Data Sharing</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We do not sell, trade, or rent your personal information. We only share data:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>With service providers (Supabase) necessary to operate our service</li>
                            <li>When required by law or to protect our rights</li>
                            <li>Never with advertisers or third-party marketers</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">6. Your Rights</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li><strong>Access:</strong> View all data we have about you and your family</li>
                            <li><strong>Delete:</strong> Request deletion of your account and all associated data</li>
                            <li><strong>Correct:</strong> Update or correct your information at any time</li>
                            <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
                        </ul>
                        <p className="text-text-sub dark:text-gray-300 mt-4">
                            To exercise these rights, contact us at: <a href="mailto:support@taskfortime.com" className="text-primary hover:underline">support@taskfortime.com</a>
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">7. Data Retention</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We retain your data for as long as your account is active. When you delete your account:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>All personal information is permanently deleted within 30 days</li>
                            <li>Backup data is deleted within 90 days</li>
                            <li>Some anonymized usage data may be retained for service improvement</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">8. International Users</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Task For Time complies with:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li><strong>GDPR:</strong> European Union General Data Protection Regulation</li>
                            <li><strong>COPPA:</strong> U.S. Children's Online Privacy Protection Act</li>
                            <li><strong>AU Privacy Act:</strong> Australian Privacy Principles</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">9. Changes to This Policy</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We may update this privacy policy from time to time. We will notify you of any material changes by:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Posting the new policy on this page</li>
                            <li>Updating the "Last updated" date</li>
                            <li>Sending an email notification (for significant changes)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">10. Contact Us</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            If you have questions about this privacy policy or our data practices, contact us at:
                        </p>
                        <p className="text-text-sub dark:text-gray-300">
                            <strong>Email:</strong> <a href="mailto:support@taskfortime.com" className="text-primary hover:underline">support@taskfortime.com</a>
                        </p>
                    </section>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}

