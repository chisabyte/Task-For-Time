"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Transaction {
    id: string;
    delta: number;
    reason: string;
    transaction_type: string;
    created_at: string;
}

export function StarsBank({ childId }: { childId: string }) {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // Get balance
        const { data: balanceData } = await supabase.rpc('get_stars_balance', {
            p_child_id: childId
        });

        if (balanceData !== null) {
            setBalance(balanceData);
        }

        // Get recent transactions
        const { data: txData } = await supabase
            .from('stars_ledger')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (txData) {
            setTransactions(txData);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (childId) {
            fetchData();

            // Real-time subscription
            const channel = supabase
                .channel('stars-updates')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'stars_ledger',
                        filter: `child_id=eq.${childId}`
                    },
                    () => {
                        fetchData();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [childId]);

    if (loading) return null;

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'task_reward': return '✅';
            case 'interest': return '📈';
            case 'parent_bonus': return '🎁';
            case 'savings_deposit': return '🏦';
            default: return '⭐';
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-4xl">⭐</span>
                    <div>
                        <h3 className="text-sm font-bold text-text-sub-light dark:text-text-sub-dark">Your Stars</h3>
                        <p className="text-3xl font-black text-yellow-700 dark:text-yellow-300">{balance.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {transactions.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">Recent Activity</h4>
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-lg"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xl">{getTransactionIcon(tx.transaction_type)}</span>
                                <span className="text-sm font-medium truncate">{tx.reason}</span>
                            </div>
                            <span className={`text-sm font-bold ${tx.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {tx.delta > 0 ? '+' : ''}{tx.delta}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
