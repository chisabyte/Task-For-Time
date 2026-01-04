"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ChildrenOverview, ChildWithStats } from "../components/ChildrenOverview";
import { CelebrationStream } from "../components/CelebrationStream";
import { AddChildModal } from "../components/AddChildModal";
import { AddAssignedTaskModal } from "../components/AddAssignedTaskModal";
import { GrantBonusModal } from "../components/GrantBonusModal";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import { TrialBanner } from "@/components/TrialBanner";
import { FamilyHealthInsights } from "../components/FamilyHealthInsights";
import { QuestManager } from "../components/QuestManager";
import { CreateQuestModal } from "../components/CreateQuestModal";
import { CoachInsightCard } from "../components/CoachInsightCard";

type Profile = Database['public']['Tables']['profiles']['Row'];
type AssignedTask = Database['public']['Tables']['assigned_tasks']['Row'];

export default function ParentDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [childrenData, setChildrenData] = useState<ChildWithStats[]>([]);
    const [celebrations, setCelebrations] = useState<any[]>([]);
    const [totalPending, setTotalPending] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Modal states
    const [showAddChild, setShowAddChild] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showGrantBonus, setShowGrantBonus] = useState(false);
    const [showCreateQuest, setShowCreateQuest] = useState(false);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profileData) {
            router.push("/role");
            return;
        }

        if (profileData.role !== 'parent') {
            router.push("/child/dashboard");
            return;
        }

        setProfile(profileData);

        if (profileData?.family_id) {
            // Fetch Children
            const { data: children } = await supabase
                .from('children')
                .select('*')
                .eq('family_id', profileData.family_id)
                .is('deleted_at', null);

            if (children) {
                const childrenWithStats = await Promise.all(children.map(async (child: any) => {
                    // Fetch all tasks for this child to debug
                    // Filter out soft-deleted tasks
                    const { data: allTasks, error: tasksError } = await supabase
                        .from('assigned_tasks')
                        .select('*')
                        .eq('child_id', child.id)
                        .eq('family_id', profileData.family_id)
                        .is('deleted_at', null); // Filter out deleted tasks

                    console.log(`[ParentDashboard] Child ${child.name} (ID: ${child.id}) - Total tasks: ${allTasks?.length || 0}`);

                    // Log each task with full details
                    allTasks?.forEach((task: AssignedTask, index: number) => {
                        console.log(`  Task ${index + 1}: "${task.title}" - Status: "${task.status}" (Type: ${typeof task.status})`);
                    });

                    if (tasksError) {
                        console.error(`[ParentDashboard] Error fetching tasks for ${child.name}:`, tasksError);
                    }

                    // Count manually from the fetched data
                    const pendingTasks = allTasks?.filter((t: AssignedTask) => {
                        const isPending = t.status === 'ready_for_review';
                        if (isPending) console.log(`  ✓ Found pending task: ${t.title}`);
                        return isPending;
                    }) || [];

                    const activeTasks = allTasks?.filter((t: AssignedTask) => {
                        const isActive = t.status === 'active';
                        if (isActive) console.log(`  ✓ Found active task: ${t.title}`);
                        return isActive;
                    }) || [];

                    const completedTasks = allTasks?.filter((t: AssignedTask) => {
                        const isCompleted = t.status === 'approved';
                        if (isCompleted) console.log(`  ✓ Found completed task: ${t.title}`);
                        return isCompleted;
                    }) || [];

                    console.log(`[ParentDashboard] ${child.name} FINAL - Pending: ${pendingTasks.length}, Active: ${activeTasks.length}, Completed: ${completedTasks.length}`);

                    return {
                        ...child,
                        pendingReviewsCount: pendingTasks.length,
                        activeTasksCount: activeTasks.length,
                        completedTasksCount: completedTasks.length
                    };
                }));

                console.log('[ParentDashboard] Setting childrenData:', childrenWithStats.map(c => ({
                    name: c.name,
                    pending: c.pendingReviewsCount,
                    active: c.activeTasksCount
                })));

                const totalPendingCalc = childrenWithStats.reduce((acc, c) => acc + c.pendingReviewsCount, 0);
                console.log('[ParentDashboard] Total pending calculated:', totalPendingCalc);

                // Create new array with new object references to ensure React detects changes
                const newChildrenData = childrenWithStats.map(c => ({ ...c }));
                setChildrenData(newChildrenData);
                setTotalPending(totalPendingCalc);
                setLastUpdate(Date.now());
            }

            // Fetch Celebrations
            const { data: approvedSubs } = await supabase
                .from('submissions')
                .select('*, children(name), tasks(title, reward_minutes)')
                .eq('family_id', profileData.family_id)
                .eq('status', 'approved')
                .order('reviewed_at', { ascending: false })
                .limit(5);

            if (approvedSubs) {
                const formatted = approvedSubs.map((sub: any) => ({
                    id: sub.id,
                    child_name: (sub.children as any)?.name || 'Unknown',
                    task_title: (sub.tasks as any)?.title || 'Task',
                    reward_minutes: (sub.tasks as any)?.reward_minutes || 0,
                    reviewed_at: sub.reviewed_at || new Date().toISOString()
                }));
                setCelebrations(formatted);
            }
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();

        // Set up real-time subscription to assigned_tasks changes
        // Only subscribe to changes for tasks in the current family
        if (profile?.family_id) {
            const channel = supabase
                .channel('parent-dashboard-assigned-tasks-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'assigned_tasks',
                        filter: `family_id=eq.${profile.family_id}`
                    },
                    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
                        console.log('[ParentDashboard] Assigned task changed:', payload);
                        // Refresh data when any task changes in this family
                        fetchData();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [fetchData, profile?.family_id]);

    const handleRefresh = () => {
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <ChildModeGuard>
            <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
                <ParentSidebar />
                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                    <TrialBanner />
                    <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                                {profile?.display_name?.substring(0, 2).toUpperCase() || 'P'}
                            </div>
                            <span className="font-bold">Task For Time</span>
                        </div>
                        <button className="p-2 text-text-main-light dark:text-text-main-dark">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                        {/* Header */}
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main-light dark:text-text-main-dark flex items-center gap-3">
                                    Welcome back, {profile?.display_name || 'Parent'}!
                                    <button
                                        onClick={handleRefresh}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        title="Refresh data"
                                    >
                                        <span className="material-symbols-outlined text-xl">refresh</span>
                                    </button>
                                </h1>
                                <p className="text-text-sub-light dark:text-text-sub-dark text-lg">
                                    The family is doing great today. <span className="text-primary-dark dark:text-primary font-semibold">{totalPending} tasks</span> are ready for your high-five!
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-white dark:bg-card-dark p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setShowAddTask(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-text-main-light font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                    Add Task
                                </button>
                                <button
                                    onClick={() => setShowGrantBonus(true)}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary/10 dark:bg-primary/20 text-teal-900 dark:text-primary font-bold text-sm rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px] fill-1">star</span>
                                    Grant Bonus
                                </button>
                                <button
                                    onClick={() => router.push("/parent/tasks")}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-transparent text-text-sub-light dark:text-text-sub-dark font-medium text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    View Tasks
                                </button>
                            </div>
                        </header>

                        {profile?.family_id && (
                            <CoachInsightCard familyId={profile.family_id} />
                        )}

                        {profile?.family_id && (
                            <FamilyHealthInsights familyId={profile.family_id} />
                        )}

                        {profile?.family_id && (
                            <QuestManager
                                familyId={profile.family_id}
                                onCreateQuest={() => setShowCreateQuest(true)}
                            />
                        )}

                        <div className="flex flex-col lg:flex-row gap-8">
                            <ChildrenOverview
                                key={`children-${lastUpdate}`}
                                childrenData={childrenData}
                                onAddChild={() => setShowAddChild(true)}
                            />
                            <CelebrationStream celebrations={celebrations} />
                        </div>
                    </div>
                </main>

                {/* Modals */}
                {profile?.family_id && (
                    <>
                        <AddChildModal
                            familyId={profile.family_id}
                            isOpen={showAddChild}
                            onClose={() => setShowAddChild(false)}
                            onChildAdded={handleRefresh}
                        />
                        <AddAssignedTaskModal
                            familyId={profile.family_id}
                            isOpen={showAddTask}
                            onClose={() => setShowAddTask(false)}
                            onTaskAdded={handleRefresh}
                        />
                        <GrantBonusModal
                            familyId={profile.family_id}
                            isOpen={showGrantBonus}
                            onClose={() => setShowGrantBonus(false)}
                            onBonusGranted={handleRefresh}
                        />
                        <CreateQuestModal
                            familyId={profile.family_id}
                            isOpen={showCreateQuest}
                            onClose={() => setShowCreateQuest(false)}
                            onQuestCreated={handleRefresh}
                        />
                    </>
                )}
            </div>
        </ChildModeGuard>
    );
}
