"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ReviewQueue } from "../components/ReviewQueue";
import { ApprovalModal, SubmissionWithDetails } from "../components/ApprovalModal";
import { ChildModeGuard } from "@/components/ChildModeGuard";

export default function ApprovalsPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
    const [discussingTaskId, setDiscussingTaskId] = useState<string | null>(null);
    const [applyingAutoApproval, setApplyingAutoApproval] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        // Get profile for family_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('family_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'parent') {
            router.push("/login"); // Strict role check
            return;
        }

        // Fetch assigned tasks with status 'ready_for_review' and join with children
        // Filter out soft-deleted tasks and deleted children
        const { data, error } = await supabase
            .from('assigned_tasks')
            .select('*, children!inner(*)')
            .eq('family_id', profile.family_id)
            .eq('status', 'ready_for_review')
            .is('deleted_at', null)
            .is('children.deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching tasks for review:", error);
        } else if (data) {
            // Transform data to match interface
            const formatted: SubmissionWithDetails[] = data.map((task: any) => ({
                id: task.id,
                submitted_at: task.created_at,
                note: null,
                proof_image_path: null,
                child: {
                    id: task.children.id,
                    name: task.children.name,
                    avatar_url: task.children.avatar_url,
                    time_bank_minutes: task.children.time_bank_minutes
                },
                task: {
                    title: task.title,
                    category: task.category,
                    reward_minutes: task.reward_minutes
                }
            }));
            setSubmissions(formatted);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleApprove = async (taskId: string) => {
        // Prevent duplicate submissions
        if (approvingTaskId === taskId) {
            return; // Already processing
        }

        setApprovingTaskId(taskId);

        try {
            // Use atomic RPC function to approve task
            // This prevents race conditions and ensures idempotency
            const { data, error } = await supabase.rpc('approve_task', {
                p_task_id: taskId
            });

            if (error) {
                // Check if it's an idempotent success (already approved)
                if (error.message?.includes('already approved') || data?.idempotent) {
                    // Task was already approved - remove from UI
                    setSubmissions(prev => prev.filter(s => s.id !== taskId));
                    setSelectedSubmission(null);
                    setSelectedTasks(prev => {
                        const next = new Set(prev);
                        next.delete(taskId);
                        return next;
                    });
                    return;
                }
                throw error;
            }

            // Success - remove from local state
            setSubmissions(prev => prev.filter(s => s.id !== taskId));
            setSelectedSubmission(null);
            setSelectedTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });

        } catch (err: any) {
            console.error("Error approving task:", err);
            const errorMessage = err?.message || "Failed to approve. Please try again.";
            alert(errorMessage);
        } finally {
            setApprovingTaskId(null);
        }
    };

    const handleDiscuss = async (taskId: string, note: string) => {
        // Prevent duplicate submissions
        if (discussingTaskId === taskId) {
            return; // Already processing
        }

        setDiscussingTaskId(taskId);

        try {
            // Get task details for event recording
            const task = submissions.find(s => s.id === taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // Update task status to 'rejected' (so child can see feedback and resubmit)
            const { error: updateError } = await supabase
                .from('assigned_tasks')
                .update({ status: 'rejected' })
                .eq('id', taskId);

            if (updateError) throw updateError;

            // Record 'rejected' event with discussion note
            const { data: { user } } = await supabase.auth.getUser();
            if (user && task) {
                const { error: eventError } = await supabase.rpc('record_task_event', {
                    p_child_id: task.child.id,
                    p_assigned_task_id: taskId,
                    p_event_type: 'rejected',
                    p_event_data: {
                        rejected_by: user.id,
                        discussion_note: note,
                        reason: 'discussion_requested'
                    }
                });

                if (eventError) {
                    console.error('Error recording event:', eventError);
                    // Don't throw - the main update succeeded
                }
            }

            // Success - remove from local state
            setSubmissions(prev => prev.filter(s => s.id !== taskId));
            setSelectedSubmission(null);
            setSelectedTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });

            // Show success message
            alert(`Discussion note sent to ${task.child.name}. The task has been returned for revision.`);

        } catch (err: any) {
            console.error("Error sending discussion note:", err);
            const errorMessage = err?.message || "Failed to send discussion note. Please try again.";
            alert(errorMessage);
        } finally {
            setDiscussingTaskId(null);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedTasks.size === 0) return;

        const taskIds = Array.from(selectedTasks);
        setApprovingTaskId('bulk');

        try {
            // Approve all selected tasks
            await Promise.all(
                taskIds.map(taskId =>
                    supabase.rpc('approve_task', { p_task_id: taskId })
                )
            );

            // Remove approved tasks from UI
            setSubmissions(prev => prev.filter(s => !selectedTasks.has(s.id)));
            setSelectedSubmission(null);
            setSelectedTasks(new Set());
        } catch (err: any) {
            console.error("Error bulk approving:", err);
            alert("Some tasks failed to approve. Please try again.");
        } finally {
            setApprovingTaskId(null);
            fetchSubmissions(); // Refresh to get accurate state
        }
    };

    const handleAutoApproval = async () => {
        setApplyingAutoApproval(true);
        try {
            const { data, error } = await supabase.rpc('apply_auto_approval');

            if (error) throw error;

            if (data?.approved_count > 0) {
                alert(`Auto-approved ${data.approved_count} task(s) based on your policies.`);
            } else {
                alert('No tasks matched auto-approval policies.');
            }

            fetchSubmissions(); // Refresh queue
        } catch (err: any) {
            console.error("Error applying auto-approval:", err);
            alert("Failed to apply auto-approval: " + err.message);
        } finally {
            setApplyingAutoApproval(false);
        }
    };

    const handleToggleSelect = (taskId: string) => {
        setSelectedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse">Loading queue...</p>
                </div>
            </div>
        );
    }

    return (
        <ChildModeGuard>
            <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
                <ParentSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                    <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">P</div>
                            <span className="font-bold">Task For Time</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-text-main-light dark:text-text-main-dark transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                                    Exceptions Queue
                                </h1>
                                <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                                    Tasks that need your attention. Most tasks are auto-approved based on your rules.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {submissions.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleBulkApprove}
                                            disabled={selectedTasks.size === 0 || approvingTaskId !== null}
                                            className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Approve Selected ({selectedTasks.size})
                                        </button>
                                        <button
                                            onClick={handleAutoApproval}
                                            disabled={applyingAutoApproval}
                                            className="px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary font-bold rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors disabled:opacity-50"
                                        >
                                            {applyingAutoApproval ? 'Applying...' : 'Auto-Approve All'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </header>

                        <ReviewQueue
                            submissions={submissions}
                            onReview={setSelectedSubmission}
                            selectedTasks={selectedTasks}
                            onToggleSelect={handleToggleSelect}
                        />
                    </div>

                    {selectedSubmission && (
                        <ApprovalModal
                            submission={selectedSubmission}
                            onClose={() => setSelectedSubmission(null)}
                            onApprove={handleApprove}
                            onDiscuss={handleDiscuss}
                            isApproving={approvingTaskId === selectedSubmission.id}
                            isDiscussing={discussingTaskId === selectedSubmission.id}
                        />
                    )}
                </main>
            </div>
        </ChildModeGuard>
    );
}
