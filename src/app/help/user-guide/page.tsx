import Link from "next/link";
import { FooterSection } from "../../../components/FooterSection";

export default function UserGuidePage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
                            <h2 className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</h2>
                        </Link>
                        <Link href="/parent/settings?section=support" className="text-sm font-medium text-primary hover:underline">
                            Back to Help & Support
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-black text-text-main dark:text-white mb-8">User Guide</h1>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">rocket_launch</span>
                        Getting Started
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Welcome to Task For Time! This guide will help you set up your family account and start building better habits.
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-text-sub dark:text-gray-300">
                            <li>Create your parent account by signing up</li>
                            <li>Add your first child from the Family Settings</li>
                            <li>Create your first task and assign it to your child</li>
                            <li>Set up rewards that your child can earn</li>
                            <li>Start the approval workflow when tasks are completed</li>
                        </ol>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">task_alt</span>
                        Assigning Tasks
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Tasks are the foundation of Task For Time. Here's how to create and assign them:
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-text-sub dark:text-gray-300">
                            <li>Go to your parent dashboard</li>
                            <li>Click "Add Task" or select a child and click "Assign Task"</li>
                            <li>Enter task details:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li><strong>Task title:</strong> A clear, specific description</li>
                                    <li><strong>Description:</strong> Additional context (optional)</li>
                                    <li><strong>Category:</strong> Organize tasks by type (optional)</li>
                                    <li><strong>Reward minutes:</strong> How many minutes your child earns upon completion</li>
                                </ul>
                            </li>
                            <li>Click "Assign Task" to send it to your child's dashboard</li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            <strong>Tip:</strong> Start with simple, achievable tasks to build momentum. You can always add more complex tasks later.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">redeem</span>
                        Rewards
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            Rewards give children something to work toward. Create rewards that match your family's values:
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-text-sub dark:text-gray-300">
                            <li>Go to your parent dashboard</li>
                            <li>Click "Add Reward" or navigate to the Rewards section</li>
                            <li>Enter reward details:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li><strong>Reward name:</strong> e.g., "30 minutes of screen time"</li>
                                    <li><strong>Cost in minutes:</strong> How many time bank minutes are required</li>
                                    <li><strong>Icon:</strong> Visual identifier (optional)</li>
                                </ul>
                            </li>
                            <li>Click "Create Reward"</li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            <strong>Tip:</strong> Balance reward costs with task rewards. Make sure children can earn enough minutes to redeem rewards regularly.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        Approvals
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            The approval process is where trust is built. Here's how it works:
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-text-sub dark:text-gray-300">
                            <li><strong>Child completes task:</strong> Your child marks a task as complete on their dashboard</li>
                            <li><strong>Task appears in Approvals:</strong> The task moves to your "Approvals" page for review</li>
                            <li><strong>You review:</strong> Click on the task to see details and any notes</li>
                            <li><strong>You approve:</strong> Click "Approve & Celebrate!" to:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li>Add reward minutes to your child's time bank</li>
                                    <li>Give your child 10 XP</li>
                                    <li>Update their level if they've reached a new threshold</li>
                                </ul>
                            </li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            <strong>Remember:</strong> Positive reinforcement builds better habits. Approve tasks when possible, and discuss issues rather than rejecting.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">lock</span>
                        PIN
                    </h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                        <p className="text-text-sub dark:text-gray-300 mb-4">
                            PINs provide quick access for children without sharing your password:
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-text-sub dark:text-gray-300">
                            <li>Go to Settings → Family Management</li>
                            <li>Select a child</li>
                            <li>Click "Set PIN" or "Change PIN"</li>
                            <li>Enter a 4-6 digit PIN</li>
                            <li>Confirm the PIN</li>
                        </ol>
                        <p className="text-sm text-text-sub dark:text-gray-400 mt-4">
                            <strong>Note:</strong> Children can log in using your email and password, then select their profile. With a PIN, they can skip password entry and go straight to their dashboard.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bug_report</span>
                        Troubleshooting
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Task not appearing on child's dashboard</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                Make sure the task is assigned to the correct child. Check that the child account is active and not deleted.
                            </p>
                        </div>
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">XP or level not updating</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                XP is only added when you approve a task. Make sure you've clicked "Approve & Celebrate!" on completed tasks.
                            </p>
                        </div>
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Time bank minutes not adding</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                Verify that the task has reward minutes set. Minutes are only added upon approval, not when the task is marked complete.
                            </p>
                        </div>
                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Can't log in</h3>
                            <p className="text-text-sub dark:text-gray-300">
                                Make sure you're using the correct email and password. If you've forgotten your password, use the password recovery option on the login page.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <Link 
                        href="/parent/settings?section=support" 
                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Help & Support
                    </Link>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}

