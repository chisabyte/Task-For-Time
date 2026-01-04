"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ChildSidebar } from "../components/ChildSidebar";
import { StatsHero } from "../components/StatsHero";
import { TaskColumn } from "../components/TaskColumn";
import { TimeAndRewardsColumn } from "../components/TimeAndRewardsColumn";
import { getActiveChildId, isInChildMode, logSessionState, exitChildMode } from "@/lib/child-session";
import { FamilyQuestProgress } from "../components/FamilyQuestProgress";
import { StarsBank } from "../components/StarsBank";
import { SavingsGoals } from "../components/SavingsGoals";
import { CreateSavingsGoalModal } from "../components/CreateSavingsGoalModal";

type Child = Database['public']['Tables']['children']['Row'];
type AssignedTask = Database['public']['Tables']['assigned_tasks']['Row'];

interface TaskCounts {
    active: number;
    readyForReview: number;
    completed: number;
}

export default function ChildDashboardPage() {
    const router = useRouter();
    const [child, setChild] = useState<Child | null>(null);
    const [activeTasks, setActiveTasks] = useState<AssignedTask[]>([]);
    const [readyForReviewTasks, setReadyForReviewTasks] = useState<AssignedTask[]>([]);
    const [completedTasks, setCompletedTasks] = useState<AssignedTask[]>([]);
    const [rewards, setRewards] = useState<Database['public']['Tables']['rewards']['Row'][]>([]);
    const [loading, setLoading] = useState(true);
    const [taskCounts, setTaskCounts] = useState<TaskCounts>({ active: 0, readyForReview: 0, completed: 0 });
    const [showCreateGoal, setShowCreateGoal] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        // First check if user has a profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            // No profile exists, redirect to role selection
            router.push("/role");
            return;
        }

        let childData: Child | null = null;

        // Log session state for debugging
        logSessionState('ChildDashboard fetchData', '/child/dashboard');

        // Check if in child mode (parent viewing as child OR child after PIN)
        const activeChildId = getActiveChildId();

        if (profile.role === 'parent' && activeChildId) {
            // Parent is viewing as a specific child (child mode)
            const { data: selectedChild, error: selectedError } = await supabase
                .from('children')
                .select('*')
                .eq('id', activeChildId)
                .eq('family_id', profile.family_id)
                .is('deleted_at', null)
                .single();

            if (selectedError || !selectedChild) {
                console.error("Error fetching selected child:", selectedError);
                // Invalid child selection, clear child mode and redirect to login
                exitChildMode();
                router.push("/login");
                return;
            }

            childData = selectedChild;
        } else if (profile.role === 'child') {
            // Regular child user - fetch their profile
            const { data: fetchedChild, error: childError } = await supabase
                .from('children')
                .select('*')
                .eq('auth_user_id', user.id)
                .is('deleted_at', null)
                .single();

            if (childError || !fetchedChild) {
                console.error("Error fetching child profile:", childError);
                // Child profile doesn't exist in children table yet
                // This would need to be created by a parent
                setLoading(false);
                return;
            }

            childData = fetchedChild;
        } else {
            // Parent without active child - redirect to profile picker (login page)
            // They need to select a child profile to view the child dashboard
            router.push("/login");
            return;
        }

        if (!childData) {
            setLoading(false);
            return;
        }

        setChild(childData);

        // Fetch ALL assigned tasks for this child (all statuses)
        // Filter out soft-deleted tasks
        const { data: allTasksData, error: tasksError } = await supabase
            .from('assigned_tasks')
            .select('*')
            .eq('child_id', childData.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (tasksError) {
            console.error("Error fetching assigned tasks:", tasksError);
        } else {
            const tasks: AssignedTask[] = allTasksData || [];

            // Categorize tasks by status
            const active = tasks.filter((t: AssignedTask) => t.status === 'active' || t.status === 'rejected');
            const readyForReview = tasks.filter((t: AssignedTask) => t.status === 'ready_for_review');
            const completed = tasks.filter((t: AssignedTask) => t.status === 'approved');

            setActiveTasks(active);
            setReadyForReviewTasks(readyForReview);
            setCompletedTasks(completed);

            setTaskCounts({
                active: active.length,
                readyForReview: readyForReview.length,
                completed: completed.length
            });
        }

        // Fetch rewards
        try {
            const { data: rewardsData, error: rewardsError } = await supabase
                .from('rewards')
                .select('*')
                .eq('family_id', childData.family_id)
                .eq('status', 'available');

            if (rewardsError) {
                console.error("Error fetching rewards:", JSON.stringify(rewardsError));
            } else {
                setRewards(rewardsData || []);
            }
        } catch (err) {
            console.error("Unexpected error fetching rewards:", err);
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();

        // Set up real-time subscription to assigned_tasks changes
        const channel = supabase
            .channel('child-assigned-tasks-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assigned_tasks'
                },
                (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
                    console.log('Task status changed:', payload);
                    // Refresh data when any task changes (e.g., parent approves)
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const handleTaskComplete = async (taskId: string) => {
        if (!child) return;

        // Prevent duplicate submissions
        if (completingTaskId === taskId) {
            return; // Already processing
        }

        setCompletingTaskId(taskId);

        try {
            console.log(`Attempting to mark task ${taskId} as ready_for_review for child ${child.id}`);

            // Update the assigned task status to ready_for_review
            // The assigned_tasks table tracks status directly, no separate submissions table needed
            // Only update if status is still 'active' or 'rejected' (idempotency check)
            const { data: updateData, error: updateError } = await supabase
                .from('assigned_tasks')
                .update({ status: 'ready_for_review' })
                .eq('id', taskId)
                .eq('child_id', child.id) // Security: only update if it belongs to this child
                .in('status', ['active', 'rejected']) // Safety: only allow submitting active or rejected tasks
                .select();

            if (updateError) {
                console.error("Error submitting task:", updateError);
                alert("Failed to submit task. Please try again.");
                return;
            }

            // Check if update actually happened (idempotency)
            if (!updateData || updateData.length === 0) {
                // Task was already submitted or doesn't exist
                console.log("Task already submitted or not found");
                // Still navigate to completion page for user feedback
                router.push(`/child/task-complete/${taskId}`);
                return;
            }

            console.log("Task updated successfully:", updateData);

            // Trigger email notification to parents
            if (updateData && updateData.length > 0) {
                const task = updateData[0];
                try {
                    await fetch('/api/notifications/task-submitted', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            taskId: task.id,
                            familyId: task.family_id,
                            childId: task.child_id
                        })
                    });
                } catch (emailError) {
                    // Don't block navigation if email fails
                    console.error('Failed to send notification email:', emailError);
                }
            }

            router.push(`/child/task-complete/${taskId}`);
        } catch (err) {
            // Catch any unexpected errors - do NOT affect auth state
            console.error("Unexpected error during task submission:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setCompletingTaskId(null);
        }
    };

    // Map assigned tasks to the format expected by TaskColumn
    const mappedActiveTasks = activeTasks.map(at => ({
        id: at.id,
        family_id: at.family_id,
        title: at.title,
        description: at.description,
        category: at.category,
        reward_minutes: at.reward_minutes,
        requires_approval: at.requires_approval,
        active: true,
        created_at: at.created_at,
        status: at.status // Pass status through
    }));

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!child) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <p>Child profile not found. Please ask your parent to set up your profile.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
            <ChildSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
                        <span className="font-bold">Task For Time</span>
                    </div>
                    <button className="p-2 text-text-main-light dark:text-text-main-dark">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                                Hi {child.name}! 🚀
                            </h1>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                                {taskCounts.active > 0 ? (
                                    <>You have <span className="text-primary-dark dark:text-primary font-bold">{taskCounts.active} new opportunities</span> to earn stars today!</>
                                ) : taskCounts.completed > 0 ? (
                                    <>You&apos;ve completed <span className="text-green-600 dark:text-green-400 font-bold">{taskCounts.completed} tasks</span>! Great job!</>
                                ) : (
                                    <>All caught up! Check back later for new tasks.</>
                                )}
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card-dark text-text-sub-light dark:text-text-sub-dark text-sm font-bold rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all hover:text-primary">
                            <span className="material-symbols-outlined text-[20px]">palette</span>
                            Customize Theme
                        </button>
                    </header>

                    {/* Task Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-card-dark rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">task_alt</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active Tasks</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{taskCounts.active} <span className="text-base font-medium text-gray-500">Tasks</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card-dark rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">pending</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ready for Review</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{taskCounts.readyForReview} <span className="text-base font-medium text-gray-500">Items</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card-dark rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{taskCounts.completed} <span className="text-base font-medium text-gray-500">Tasks</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <StatsHero
                        childName={child.name}
                        childId={child.id}
                        level={child.level}
                        xp={child.xp}
                    />

                    {/* Family Quest Progress */}
                    {child.family_id && (
                        <FamilyQuestProgress familyId={child.family_id} />
                    )}

                    {/* Virtual Economy */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <StarsBank childId={child.id} />
                        <SavingsGoals
                            childId={child.id}
                            onCreateGoal={() => setShowCreateGoal(true)}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        <TaskColumn
                            tasks={mappedActiveTasks as any}
                            completedCount={taskCounts.completed}
                            onComplete={handleTaskComplete}
                            completingTaskId={completingTaskId}
                        />
                        <TimeAndRewardsColumn
                            timeBankMinutes={child.time_bank_minutes}
                            rewards={rewards}
                            childId={child.id}
                            onRedeem={() => {
                                // Refresh data after redeeming
                                fetchData();
                            }}
                        />
                    </div>

                    {/* Completed Tasks Section */}
                    {completedTasks.length > 0 && (
                        <section className="mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-black tracking-tight text-teal-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500 text-3xl">emoji_events</span>
                                    Completed Tasks
                                </h2>
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full">
                                    {completedTasks.length} Completed
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedTasks.slice(0, 6).map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white dark:bg-card-dark rounded-xl p-4 border border-green-100 dark:border-green-900/30 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">check</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                    +{task.reward_minutes} min earned
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Ready for Review Section */}
                    {readyForReviewTasks.length > 0 && (
                        <section className="mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-black tracking-tight text-teal-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-3xl">hourglass_top</span>
                                    Waiting for Approval
                                </h2>
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                                    {readyForReviewTasks.length} Pending
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {readyForReviewTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white dark:bg-card-dark rounded-xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg animate-pulse">pending</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Waiting for parent approval
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
            <CreateSavingsGoalModal
                childId={child.id}
                isOpen={showCreateGoal}
                onClose={() => setShowCreateGoal(false)}
                onGoalCreated={() => {
                    setShowCreateGoal(false);
                }}
            />
        </div>
    );
}
