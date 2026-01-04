import Link from "next/link";
import { FooterSection } from "../components/FooterSection";

export default function HelpPage() {
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
                <h1 className="text-4xl font-black text-text-main dark:text-white mb-8">Help & Support</h1>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">support</span>
                        Getting Started
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Adding Your First Child</h3>
                            <ol className="list-decimal pl-6 space-y-2 text-text-sub dark:text-gray-300">
                                <li>Log in to your parent account</li>
                                <li>Go to your dashboard</li>
                                <li>Click "Add Child" button</li>
                                <li>Enter your child's name</li>
                                <li>Optionally upload an avatar</li>
                                <li>Click "Create Child"</li>
                            </ol>
                            <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                                You can add multiple children to your family. Each child has their own dashboard, XP, level, and time bank.
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Assigning Tasks</h3>
                            <ol className="list-decimal pl-6 space-y-2 text-text-sub dark:text-gray-300">
                                <li>Go to your parent dashboard</li>
                                <li>Click "Add Task" or select a child and click "Assign Task"</li>
                                <li>Enter task details:
                                    <ul className="list-disc pl-6 mt-2 space-y-1">
                                        <li>Task title (required)</li>
                                        <li>Description (optional)</li>
                                        <li>Category (optional)</li>
                                        <li>Reward minutes (how many minutes they earn)</li>
                                    </ul>
                                </li>
                                <li>Click "Assign Task"</li>
                            </ol>
                            <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                                Tasks appear immediately on your child's dashboard. They can mark tasks as complete when finished.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        Approval Flow
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">How Task Approval Works</h3>
                        <ol className="list-decimal pl-6 space-y-2 text-text-sub dark:text-gray-300">
                            <li><strong>Child completes task:</strong> Child clicks "I did it!" on their dashboard</li>
                            <li><strong>Task moves to review:</strong> Task appears in your "Approvals" page</li>
                            <li><strong>Parent reviews:</strong> Click on the task to see details</li>
                            <li><strong>Parent approves:</strong> Click "Approve & Celebrate!" to:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li>Add reward minutes to child's time bank</li>
                                    <li>Give child 10 XP</li>
                                    <li>Update child's level (if XP threshold reached)</li>
                                </ul>
                            </li>
                            <li><strong>Child sees update:</strong> XP, level, and time bank update immediately</li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            <strong>Tip:</strong> Positive reinforcement builds better habits. Approve tasks when possible, and discuss issues rather than rejecting.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">stars</span>
                        XP, Levels & Time Bank
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Experience Points (XP)</h3>
                            <p className="text-text-sub dark:text-gray-300 mb-2">
                                Children earn <strong>10 XP</strong> for each approved task. XP is a measure of progress and achievement.
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Levels</h3>
                            <p className="text-text-sub dark:text-gray-300 mb-2">
                                Levels are calculated based on XP: <strong>Level = 1 + floor(XP / 100)</strong>
                            </p>
                            <p className="text-sm text-text-sub dark:text-gray-400">
                                Example: 0-99 XP = Level 1, 100-199 XP = Level 2, 200-299 XP = Level 3, etc.
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Time Bank</h3>
                            <p className="text-text-sub dark:text-gray-300 mb-2">
                                The time bank stores minutes earned from completed tasks. Children can redeem these minutes for rewards you create.
                            </p>
                            <p className="text-sm text-text-sub dark:text-gray-400">
                                <strong>Important:</strong> Task For Time does NOT automatically block devices or enforce screen time limits. 
                                Parents decide when and how to honor the time bank.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">redeem</span>
                        Rewards
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Creating Rewards</h3>
                        <ol className="list-decimal pl-6 space-y-2 text-text-sub dark:text-gray-300">
                            <li>Go to your parent dashboard</li>
                            <li>Click "Add Reward" (or go to Rewards section)</li>
                            <li>Enter reward details:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li>Reward name (e.g., "30 minutes of screen time")</li>
                                    <li>Cost in minutes (how many time bank minutes required)</li>
                                    <li>Optional icon</li>
                                </ul>
                            </li>
                            <li>Click "Create Reward"</li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            Rewards appear on your child's dashboard. They can redeem rewards when they have enough time bank minutes.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">question_mark</span>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Does Task For Time block devices automatically?</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                <strong>No.</strong> Task For Time is a responsibility and habit-building system. It does NOT provide device blocking, 
                                OS-level enforcement, or automatic screen time limits. Parents decide when and how to honor the time bank.
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Can I delete a child's account?</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                Yes. Go to Settings → Family Management to delete a child. This will soft-delete the child (they won't appear 
                                in your dashboard, but data is retained for 30 days in case you need to restore).
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">What happens if I delete my account?</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                All your data, children's data, tasks, and progress will be permanently deleted within 30 days. 
                                This action cannot be undone. See Settings → My Account → Delete Account & Data.
                            </p>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Can children create their own accounts?</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                No. All child accounts are created and managed by parents. Children log in using their parent's email 
                                and password, then select their child account (or use a PIN if set up).
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">mail</span>
                        Contact Support
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Need help? Have a question? Found a bug? We're here to help!
                        </p>
                        <p className="text-text-sub dark:text-gray-300">
                            <strong>Email:</strong> <a href="mailto:support@taskfortime.com" className="text-primary hover:underline">support@taskfortime.com</a>
                        </p>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            We typically respond within 24-48 hours during business days.
                        </p>
                    </div>
                </section>
            </main>

            <FooterSection />
        </div>
    );
}

