import Link from "next/link";
import { FooterSection } from "../../components/FooterSection";

export default function TermsOfServicePage() {
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
                    <h1 className="text-4xl font-black text-text-main dark:text-white mb-4">Terms of Service</h1>
                    <p className="text-sm text-text-sub dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            By accessing or using Task For Time ("the Service"), you agree to be bound by these Terms of Service. 
                            If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">2. Description of Service</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Task For Time is a family task management platform that:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Helps parents assign tasks to children</li>
                            <li>Allows children to track task completion</li>
                            <li>Enables parents to approve completed tasks</li>
                            <li>Gamifies task completion with XP, levels, and time bank rewards</li>
                            <li>Provides a system for redeeming earned time for rewards</li>
                        </ul>
                        <p className="text-text-sub dark:text-gray-300 mt-4">
                            <strong>Important:</strong> Task For Time does NOT provide device blocking, OS-level enforcement, 
                            or automatic screen time limits. It is a responsibility and habit-building system.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">3. Beta Service</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Task For Time is currently in beta. This means:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>The service may have bugs or interruptions</li>
                            <li>Features may change or be removed</li>
                            <li>Data may be lost (though we make every effort to prevent this)</li>
                            <li>We are not liable for any damages resulting from beta service issues</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">4. User Accounts</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            To use Task For Time, you must:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Be at least 18 years old (or have parental consent)</li>
                            <li>Provide accurate account information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Be responsible for all activity under your account</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">5. Parental Responsibility</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Parents using Task For Time are responsible for:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Creating and managing child accounts</li>
                            <li>Setting appropriate tasks and rewards</li>
                            <li>Monitoring their children's use of the service</li>
                            <li>Ensuring compliance with these terms by their children</li>
                            <li>Deciding when and how to enforce screen time limits</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">6. Acceptable Use</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            You agree NOT to:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Use the service for any illegal purpose</li>
                            <li>Attempt to hack, disrupt, or damage the service</li>
                            <li>Share your account with others</li>
                            <li>Create fake or misleading task data</li>
                            <li>Use automated tools to manipulate the system</li>
                            <li>Harass, abuse, or harm other users</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">7. Intellectual Property</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            The Task For Time service, including all content, features, and functionality, is owned by us and 
                            protected by copyright, trademark, and other intellectual property laws. You may not:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Copy, modify, or create derivative works</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                            <li>Use our trademarks or branding without permission</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">8. Limitation of Liability</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>The service is provided "as is" without warranties of any kind</li>
                            <li>We are not liable for any indirect, incidental, or consequential damages</li>
                            <li>We are not responsible for data loss, service interruptions, or security breaches</li>
                            <li>Our total liability is limited to the amount you paid for the service (currently $0 during beta)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">9. Termination</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We may terminate or suspend your account if you:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Violate these terms of service</li>
                            <li>Engage in fraudulent or illegal activity</li>
                            <li>Fail to pay for the service (when applicable)</li>
                        </ul>
                        <p className="text-text-sub dark:text-gray-300 mt-4">
                            You may delete your account at any time through the settings page. Upon deletion, your data will 
                            be permanently removed as described in our Privacy Policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">10. Changes to Terms</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            We reserve the right to modify these terms at any time. We will notify you of material changes by:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2">
                            <li>Posting the updated terms on this page</li>
                            <li>Updating the "Last updated" date</li>
                            <li>Sending an email notification (for significant changes)</li>
                        </ul>
                        <p className="text-text-sub dark:text-gray-300 mt-4">
                            Continued use of the service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">11. Governing Law</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through 
                            binding arbitration or in the courts of [Your Jurisdiction].
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">12. Contact Information</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            For questions about these terms, contact us at:
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

