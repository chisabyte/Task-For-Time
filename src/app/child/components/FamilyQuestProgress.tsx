"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface QuestProgress {
    quest_id: string;
    total_assigned: number;
    total_completed: number;
    current_completion_rate: number;
    target_rate: number;
    is_met: boolean;
}

interface Quest {
    id: string;
    title: string;
    reward_description: string;
    target_completion_rate: number;
    end_date: string;
    status: string;
}

export function FamilyQuestProgress({ familyId }: { familyId: string }) {
    const [quest, setQuest] = useState<Quest | null>(null);
    const [progress, setProgress] = useState<QuestProgress | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchQuest = async () => {
        const { data, error } = await supabase
            .from('family_quests')
            .select('*')
            .eq('family_id', familyId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!error && data) {
            // Fetch progress manually to filter out deleted children
            // This ensures consistency even if the RPC is stale
            const { data: activeChildren } = await supabase
                .from('children')
                .select('id')
                .eq('family_id', familyId)
                .is('deleted_at', null);

            const activeChildIds = new Set(activeChildren?.map((c: any) => c.id) || []);

            const { data: tasks } = await supabase
                .from('assigned_tasks')
                .select('id, status, child_id')
                .eq('family_id', familyId)
                .is('deleted_at', null)
                .gte('created_at', data.start_date)
                .lte('created_at', data.end_date);

            const activeTasks = (tasks as any[])?.filter((t: any) => activeChildIds.has(t.child_id)) || [];

            // If there are no active children or no tasks assigned to active children, 
            // this quest might be from a deleted setup. Hide it.
            if (activeChildIds.size === 0 || activeTasks.length === 0) {
                setQuest(null);
                setProgress(null);
                setLoading(false);
                return;
            }

            const total_assigned = activeTasks.length;
            const total_completed = activeTasks.filter((t: any) => ['ready_for_review', 'approved'].includes(t.status)).length;
            const current_completion_rate = total_assigned > 0 ? (total_completed / total_assigned) * 100 : 0;

            const progressData: QuestProgress = {
                quest_id: data.id,
                total_assigned,
                total_completed,
                current_completion_rate,
                target_rate: data.target_completion_rate,
                is_met: current_completion_rate >= data.target_completion_rate
            };

            // Only set quest and progress if we are sure it's valid for current children
            setQuest(data);
            setProgress(progressData);

            // Check if quest was just completed
            if (progressData.is_met && data.status === 'active') {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);
            }
        } else {
            setQuest(null);
            setProgress(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (familyId) {
            fetchQuest();

            // Set up real-time subscription for quest updates
            const channel = supabase
                .channel('quest-updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'family_quests',
                        filter: `family_id=eq.${familyId}`
                    },
                    () => {
                        fetchQuest();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'assigned_tasks',
                    },
                    () => {
                        fetchQuest();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [familyId]);

    if (loading || !quest || !progress) return null;

    const progressPercent = progress.current_completion_rate;
    const daysLeft = Math.ceil((new Date(quest.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <>
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
                    <div className="bg-white dark:bg-card-dark rounded-3xl p-8 max-w-md mx-4 text-center animate-in zoom-in duration-500">
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-3xl font-black mb-2">Quest Complete!</h2>
                        <p className="text-xl mb-4">Your family earned:</p>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6">
                            {quest.reward_description}
                        </div>
                        <p className="text-text-sub-light dark:text-text-sub-dark">
                            Amazing teamwork! 🌟
                        </p>
                    </div>
                </div>
            )}

            <div className="p-5 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 rounded-2xl border-2 border-purple-300 dark:border-purple-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400 animate-pulse">
                        flag
                    </span>
                    <div className="flex-1">
                        <h3 className="font-black text-xl">{quest.title}</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                            Family Quest • {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon!'}
                        </p>
                    </div>
                </div>

                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">Team Progress</span>
                        <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-700 ease-out rounded-full relative"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        >
                            {progressPercent > 10 && (
                                <div className="absolute inset-0 flex items-center justify-end pr-2">
                                    <span className="text-xs font-bold text-white drop-shadow">
                                        {Math.round(progressPercent)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-text-sub-light dark:text-text-sub-dark">
                        <span>{progress.total_completed} completed</span>
                        <span>Goal: {quest.target_completion_rate}%</span>
                    </div>
                </div>

                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark">Reward</div>
                        <div className="font-bold text-purple-700 dark:text-purple-300">{quest.reward_description}</div>
                    </div>
                </div>

                <div className="mt-4 text-center text-sm font-medium text-purple-700 dark:text-purple-300 italic">
                    "Teamwork makes the dream work!" 💪
                </div>
            </div>
        </>
    );
}
