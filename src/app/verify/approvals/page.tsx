"use client";

import { ParentSidebar } from "../../parent/components/ParentSidebar";
import { ReviewQueue } from "../../parent/components/ReviewQueue";
import { SubmissionWithDetails } from "../../parent/components/ApprovalModal";

export default function VerifyApprovals() {

    // Mock Data matching Parent Approval Flow.html
    const submissions: SubmissionWithDetails[] = [
        {
            id: "1",
            submitted_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2m ago
            note: "The bed is made and pillows are fluffed!",
            proof_image_path: null,
            child: {
                id: "child-1",
                name: "Leo",
                avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCbsfM_uATur9k4afFBS__5Zs0hV1wvCS8N_uyCdzJdv07Bk2t7uASkvEx_u5bTlUXg7kp6MFElwg9jeo6OZluZYsQ9WBAM7gDgn-Pdu5-rjhENuBP9Y0JsrIIPFEY-jvoONUgOLy9Rv_GguzXauDPK-tvim6zpi7lZYyymf6Idxx5j9Eph9aUQmcwIZpS4QXn8RRFF6kEwfXUTXUZvzke6wj2mMaAqR261DpoOpec3pjZVLeGt0zmgnnI1ZQIJB0CUysLdqIVyUg",
                time_bank_minutes: 135
            },
            task: {
                title: "Make Your Bed",
                category: "Morning",
                reward_minutes: 15
            }
        },
        {
            id: "2",
            submitted_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15m ago
            note: "Completed worksheet page 42.",
            proof_image_path: null,
            child: {
                id: "child-2",
                name: "Mia",
                avatar_url: null, // HTML has default M avatar
                time_bank_minutes: 45
            },
            task: {
                title: "Math Homework",
                category: "Study",
                reward_minutes: 30
            }
        },
        // The 3rd item in HTML was "Approved" and in a different style (history).
        // My ReviewQueue component only shows Pending. 
        // I will omit the approved/history item for now as parity focuses on the reviewable items
        // or I would need to extend ReviewQueue to show history.
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
            <ParentSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">P</div>
                        <span className="font-bold">Task For Time</span>
                    </div>
                </div>

                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <header className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                            Approvals Needed
                        </h1>
                        <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                            Review your children&apos;s progress and celebrate their wins!
                        </p>
                    </header>

                    <ReviewQueue
                        submissions={submissions}
                        onReview={() => { }}
                    />
                </div>
            </main>
        </div>
    );
}
