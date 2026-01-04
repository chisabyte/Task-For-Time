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

export function QuestManager({ familyId, onCreateQuest }: { familyId: string; onCreateQuest: () => void }) {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [progress, setProgress] = useState<Record<string, QuestProgress>>({});
    const [loading, setLoading] = useState(true);

    const fetchQuests = async () => {
        const { data, error } = await supabase
            .from('family_quests')
            .select('*')
            .eq('family_id', familyId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setQuests(data);

            // Fetch progress for each quest manually to filter out deleted children
            // This bypasses the need for immediate RPC update if migrations haven't run
            const { data: activeChildren } = await supabase
                .from('children')
                .select('id')
                .eq('family_id', familyId)
                .is('deleted_at', null);

            const activeChildIds = new Set(activeChildren?.map((c: any) => c.id) || []);

            const validQuests = [];
            for (const quest of data) {
                const { data: tasks } = await supabase
                    .from('assigned_tasks')
                    .select('id, status, child_id')
                    .eq('family_id', familyId)
                    .gte('created_at', quest.start_date)
                    .lte('created_at', quest.end_date);

                const activeTasks = (tasks as any[])?.filter((t: any) => activeChildIds.has(t.child_id)) || [];

                // Only include quest if it has tasks for active children
                if (activeTasks.length > 0) {
                    const total_assigned = activeTasks.length;
                    const total_completed = activeTasks.filter((t: any) => ['ready_for_review', 'approved'].includes(t.status)).length;
                    const current_completion_rate = total_assigned > 0 ? (total_completed / total_assigned) * 100 : 0;

                    const questProgress: QuestProgress = {
                        quest_id: quest.id,
                        total_assigned,
                        total_completed,
                        current_completion_rate,
                        target_rate: quest.target_completion_rate,
                        is_met: current_completion_rate >= quest.target_completion_rate
                    };

                    setProgress(prev => ({ ...prev, [quest.id]: questProgress }));
                    validQuests.push(quest);
                }
            }
            setQuests(validQuests);
        }
        setLoading(false);
    };

    const handleDeleteQuest = async (questId: string) => {
        if (!confirm("Are you sure you want to end this quest? It will be removed from all dashboards.")) {
            return;
        }

        const { error } = await supabase
            .from('family_quests')
            .update({ status: 'expired' }) // We 'expire' it instead of delete to keep history
            .eq('id', questId);

        if (error) {
            alert("Error ending quest: " + error.message);
        } else {
            fetchQuests();
        }
    };

    useEffect(() => {
        if (familyId) {
            fetchQuests();
        }
    }, [familyId]);

    if (loading || quests.length === 0) {
        return (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">flag</span>
                    <div>
                        <h3 className="font-black text-lg">No Active Quest</h3>
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark">Create a shared goal for the family!</p>
                    </div>
                </div>
                <button
                    onClick={onCreateQuest}
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Create Quest
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {quests.map((quest) => {
                const questProgress = progress[quest.id];
                const progressPercent = questProgress?.current_completion_rate || 0;
                const daysLeft = Math.ceil((new Date(quest.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                    <div
                        key={quest.id}
                        className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">flag</span>
                                <div>
                                    <h3 className="font-black text-lg">{quest.title}</h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">🎁 {quest.reward_description}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark">
                                    {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}
                                </div>
                                <button
                                    onClick={() => handleDeleteQuest(quest.id)}
                                    className="p-1 hover:text-red-500 transition-colors"
                                    title="End Quest"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span>Family Progress</span>
                                <span className="text-purple-600 dark:text-purple-400">
                                    {Math.round(progressPercent)}% / {quest.target_completion_rate}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                            </div>
                            {questProgress && (
                                <div className="text-xs text-text-sub-light dark:text-text-sub-dark">
                                    {questProgress.total_completed} of {questProgress.total_assigned} tasks completed
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
