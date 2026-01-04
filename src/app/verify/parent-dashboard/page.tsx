"use client";

import { ParentSidebar } from "../../parent/components/ParentSidebar";
import { ParentHeader } from "../../parent/components/ParentHeader";
import { ChildrenOverview, ChildWithStats } from "../../parent/components/ChildrenOverview";
import { CelebrationStream } from "../../parent/components/CelebrationStream";

export default function VerifyParentDashboard() {
    // Mock Data matching Parents Dashboard.html
    const profile = {
        display_name: "Sarah", // "Welcome back, Sarah!"
    };

    const childrenData: ChildWithStats[] = [
        {
            id: "1",
            name: "Leo",
            level: 4,
            xp: 250, // Not strictly in overview, but level is
            time_bank_minutes: 135, // 2h 15m
            avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCbsfM_uATur9k4afFBS__5Zs0hV1wvCS8N_uyCdzJdv07Bk2t7uASkvEx_u5bTlUXg7kp6MFElwg9jeo6OZluZYsQ9WBAM7gDgn-Pdu5-rjhENuBP9Y0JsrIIPFEY-jvoONUgOLy9Rv_GguzXauDPK-tvim6zpi7lZYyymf6Idxx5j9Eph9aUQmcwIZpS4QXn8RRFF6kEwfXUTXUZvzke6wj2mMaAqR261DpoOpec3pjZVLeGt0zmgnnI1ZQIJB0CUysLdqIVyUg",
            pendingReviewsCount: 2,
            activeTasksCount: 3,
            completedTasksCount: 5,
            pin: null,
            family_id: "mock",
            auth_user_id: null,
            created_at: "",
            deleted_at: null
        },
        {
            id: "2",
            name: "Mia",
            level: 2,
            xp: 100,
            time_bank_minutes: 45, // 45m
            avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmz4fjLCXtCttyftKcHZUi7lNdzBIqt3tX2MTdpC9NxO5DCjg5sIwsTHqacnQ54j9IErb_vCqUhJcc7cMJArRw_fjmau4dMiEN3ypkOuAqZPmCHc7ySMBvSJOofxeB8ClDajaf2yJ7LTLwX9oPKA-aissWiOtn4dZ78gUui8fq3gbZTznShjeUnvhg-SSFxf3Tqf_iQorqe5ZlzjagsVpC-aAJEBXnShlbD_U5xfXEfF2vWp8LTNuZDgmtUfz9-03urbnHR3VsmmA",
            pendingReviewsCount: 0,
            activeTasksCount: 2,
            completedTasksCount: 8,
            pin: null,
            family_id: "mock",
            auth_user_id: null,
            created_at: "",
            deleted_at: null
        },
        {
            id: "3",
            name: "Sam",
            level: 6,
            xp: 500,
            time_bank_minutes: 90, // 1h 30m
            avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCX4T-SOpkP6Q_HhWRCA4qa2U5CORUV6SPe8fVfAIxUhoZy-jgO6cwaY33U8Y4z-QMfs7qHFLTURcaOTNM-m-5B0DoecjK7qIqsDJ_ViNlB3FZ4l6MfOBeb9JcCI55UI2klmpdSekjfVb49thCDFFPhUtRf2N8pixxKwGVY4idIgLE9Jd4lo9yr6fuG6WoV23zvl2YN2QQ0gAyFCjKV8qOwFKcShDcRom-9zt2xQh1W8nSpnTuoKhBBj3SkSW8gEP_5WwV3HCy_chY",
            pendingReviewsCount: 1,
            activeTasksCount: 1,
            completedTasksCount: 12,
            pin: null,
            family_id: "mock",
            auth_user_id: null,
            created_at: "",
            deleted_at: null
        }
    ];

    const celebrations = [
        {
            id: "1",
            child_name: "Leo",
            task_title: "Cleaned his room like a champion", // "cleaned his room..."
            reward_minutes: 30,
            reviewed_at: new Date(Date.now() - 10 * 60000).toISOString() // 10 mins ago
        },
        {
            id: "2",
            child_name: "Sam",
            task_title: "Finished reading practice",
            reward_minutes: 15,
            reviewed_at: new Date(Date.now() - 60 * 60000).toISOString() // 1 hour ago
        },
        // Note: My CelebrationStream component treats everything as tasks currently, 
        // the HTML had "Redeemed Reward" and "Family Goal". 
        // I will map them as best as possible or acknowledge divergence if my component is strictly for tasks.
        {
            id: "3",
            child_name: "Mia",
            task_title: "Redeemed 'Movie Night Picker'",
            reward_minutes: 0, // Redemption
            reviewed_at: new Date(Date.now() - 24 * 60 * 60000).toISOString() // Yesterday
        }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
            <ParentSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
                        <span className="font-bold">Task For Time</span>
                    </div>
                </div>

                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <ParentHeader
                        parentName={profile.display_name}
                        pendingReviewsCount={3} // 2+1
                    />
                    <div className="flex flex-col lg:flex-row gap-8">
                        <ChildrenOverview childrenData={childrenData} />
                        <CelebrationStream celebrations={celebrations} />
                    </div>
                </div>
            </main>
        </div>
    );
}
