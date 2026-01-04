"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type AIInsight = {
    id: string;
    family_id: string;
    signal_type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    created_at: string;
    dismissed_at: string | null;
};

export function FamilyHealthInsights({ familyId }: { familyId: string }) {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInsights = async () => {
        const { data, error } = await supabase
            .from('ai_family_insights')
            .select('*')
            .eq('family_id', familyId)
            .is('dismissed_at', null)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setInsights(data as AIInsight[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (familyId) {
            fetchInsights();
        }
    }, [familyId]);

    const handleDismiss = async (id: string) => {
        const { error } = await supabase
            .from('ai_family_insights')
            .update({ dismissed_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setInsights(prev => prev.filter(i => i.id !== id));
        }
    };

    if (loading || insights.length === 0) return null;

    return (
        <section className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Family Health Insights
                </h2>
                <span className="text-sm text-text-sub-light dark:text-text-sub-dark bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full font-medium">
                    AI Guardian
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white dark:bg-card-dark relative group transition-all hover:shadow-md ${insight.severity === 'high' ? 'border-l-red-500' :
                                insight.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                            } border border-gray-100 dark:border-gray-800`}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${insight.severity === 'high' ? 'bg-red-500' :
                                        insight.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}></span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-text-sub-light dark:text-text-sub-dark">
                                    {insight.signal_type.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <p className="text-sm leading-relaxed pr-8 font-medium italic text-teal-900 dark:text-teal-100">
                                "{insight.message}"
                            </p>
                        </div>

                        <button
                            onClick={() => handleDismiss(insight.id)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-text-sub-light dark:text-text-sub-dark"
                            title="Dismiss insight"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
