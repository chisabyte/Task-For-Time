"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SavingsGoal {
    id: string;
    title: string;
    target_stars: number;
    current_stars: number;
    status: string;
    completed_at: string | null;
}

export function SavingsGoals({ childId, onCreateGoal }: { childId: string; onCreateGoal: () => void }) {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchGoals = async () => {
        const { data } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('child_id', childId)
            .in('status', ['active', 'completed'])
            .order('created_at', { ascending: false });

        if (data) {
            setGoals(data);
        }

        // Get current balance
        const { data: balanceData } = await supabase.rpc('get_stars_balance', {
            p_child_id: childId
        });

        if (balanceData !== null) {
            setBalance(balanceData);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (childId) {
            fetchGoals();

            // Real-time subscription
            const channel = supabase
                .channel('savings-goals-updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'savings_goals',
                        filter: `child_id=eq.${childId}`
                    },
                    () => {
                        fetchGoals();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [childId]);

    if (loading) return null;

    if (goals.length === 0) {
        return (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
                <div className="text-center">
                    <span className="text-5xl mb-3 block">🎯</span>
                    <h3 className="text-lg font-black mb-2">Start Saving!</h3>
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">
                        Set a goal and watch your stars grow!
                    </p>
                    <button
                        onClick={onCreateGoal}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create Your First Goal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Savings Goals
                </h3>
                <button
                    onClick={onCreateGoal}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + New Goal
                </button>
            </div>

            {goals.map((goal) => {
                const progress = Math.min((goal.current_stars / goal.target_stars) * 100, 100);
                const isCompleted = goal.status === 'completed';

                return (
                    <div
                        key={goal.id}
                        className={`p-5 rounded-2xl border-2 ${isCompleted
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                                : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-black text-lg flex items-center gap-2">
                                    {isCompleted && <span className="text-2xl">🎉</span>}
                                    {goal.title}
                                </h4>
                                {isCompleted && (
                                    <p className="text-sm text-green-700 dark:text-green-300 font-bold">
                                        Goal Reached! 🌟
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark">
                                    {goal.current_stars.toLocaleString()} / {goal.target_stars.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 rounded-full ${isCompleted
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                >
                                    {progress > 10 && (
                                        <div className="h-full flex items-center justify-end pr-2">
                                            <span className="text-xs font-bold text-white drop-shadow">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isCompleted && (
                                <div className="text-xs text-text-sub-light dark:text-text-sub-dark">
                                    {goal.target_stars - goal.current_stars > 0 ? (
                                        <span>
                                            Just {(goal.target_stars - goal.current_stars).toLocaleString()} more stars to go! 💪
                                        </span>
                                    ) : (
                                        <span>You did it! 🎉</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
