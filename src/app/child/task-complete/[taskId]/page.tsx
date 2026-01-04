"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ChildSidebar } from "../../components/ChildSidebar";
import { StatsHero } from "../../components/StatsHero";
import { TaskColumn } from "../../components/TaskColumn";
import { TimeAndRewardsColumn } from "../../components/TimeAndRewardsColumn";
import { CompletionModal } from "../../components/CompletionModal";
import { getActiveChildId, logSessionState, exitChildMode } from "@/lib/child-session";

type Child = Database['public']['Tables']['children']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type AssignedTask = Database['public']['Tables']['assigned_tasks']['Row'];

export default function TaskCompletionPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.taskId as string;

    const [child, setChild] = useState<Child | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [rewards, setRewards] = useState<Database['public']['Tables']['rewards']['Row'][]>([]);
    const [completedTask, setCompletedTask] = useState<AssignedTask | null>(null);
    const [isValidationOpen, setIsValidationOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
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
                router.push("/role");
                return;
            }

            let childData: Child | null = null;

            // Log session state for debugging
            logSessionState('TaskCompletePage fetchData', `/child/task-complete/${taskId}`);

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
                    // Invalid child selection, clear and redirect to profile picker
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
                    setLoading(false);
                    return;
                }

                childData = fetchedChild;
            } else {
                // Parent without active child - redirect to profile picker
                router.push("/login");
                return;
            }

            if (!childData) {
                setLoading(false);
                return;
            }

            setChild(childData);

            // Fetch background tasks
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .eq('family_id', childData.family_id)
                .eq('active', true);
            setTasks(tasksData || []);

            // Fetch rewards
            const { data: rewardsData } = await supabase
                .from('rewards')
                .select('*')
                .eq('family_id', childData.family_id)
                .eq('status', 'available');
            setRewards(rewardsData || []);

            // Fetch specific completed task from assigned_tasks (not tasks table)
            if (taskId) {
                const { data: taskData } = await supabase
                    .from('assigned_tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();
                setCompletedTask(taskData);
            }

            setLoading(false);
        };
        fetchData();
    }, [router, taskId]);

    const handleClose = () => {
        router.push("/child/dashboard");
    };

    if (loading) return null; // or spinner

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
            <ChildSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                {/* Reused Dashboard Header/Content for background context */}
                <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
                        <span className="font-bold">Task For Time</span>
                    </div>
                </div>
                <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                                Hi {child?.name}! 🚀
                            </h1>
                            <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                                You have <span className="text-primary-dark dark:text-primary font-bold">{tasks.length} new opportunities</span> to earn stars today!
                            </p>
                        </div>
                    </header>

                    {child && (
                        <StatsHero
                            childName={child.name}
                            childId={child.id}
                            level={child.level}
                            xp={child.xp}
                        />
                    )}

                    <div className="flex flex-col lg:flex-row gap-8">
                        <TaskColumn
                            tasks={tasks} // Background tasks
                            completedCount={0}
                            onComplete={() => { }} // No-op for background
                        />
                        {child && (
                            <TimeAndRewardsColumn
                                timeBankMinutes={child.time_bank_minutes}
                                rewards={rewards}
                                childId={child.id}
                                onRedeem={() => {
                                    window.location.reload();
                                }}
                            />
                        )}
                    </div>
                </div>

                {isValidationOpen && completedTask && child && (
                    <CompletionModal
                        onClose={handleClose}
                        taskTitle={completedTask.title}
                        rewardMinutes={completedTask.reward_minutes}
                        childName={child.name}
                    />
                )}
            </main>
        </div>
    );
}
