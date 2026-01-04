"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Child {
    id: string;
    name: string;
}

interface InterestSetting {
    child_id: string;
    weekly_rate: number;
}

export function EconomySettings({ familyId }: { familyId: string }) {
    const [children, setChildren] = useState<Child[]>([]);
    const [interestSettings, setInterestSettings] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // Get children
        const { data: childrenData } = await supabase
            .from('children')
            .select('id, name')
            .eq('family_id', familyId)
            .is('deleted_at', null);

        if (childrenData) {
            setChildren(childrenData);

            // Get interest settings for each child
            const { data: settingsData } = await supabase
                .from('interest_settings')
                .select('*')
                .in('child_id', childrenData.map((c: Child) => c.id));

            const settingsMap: Record<string, number> = {};
            settingsData?.forEach((s: InterestSetting) => {
                settingsMap[s.child_id] = s.weekly_rate;
            });
            setInterestSettings(settingsMap);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (familyId) {
            fetchData();
        }
    }, [familyId]);

    const handleRateChange = async (childId: string, newRate: number) => {
        // Upsert interest setting
        const { error } = await supabase
            .from('interest_settings')
            .upsert({
                child_id: childId,
                weekly_rate: newRate
            }, {
                onConflict: 'child_id'
            });

        if (!error) {
            setInterestSettings(prev => ({ ...prev, [childId]: newRate }));
        }
    };

    const handleAdjustStars = async (childId: string, delta: number, reason: string) => {
        const { error } = await supabase.rpc('adjust_stars', {
            p_child_id: childId,
            p_delta: delta,
            p_reason: reason,
            p_transaction_type: delta > 0 ? 'parent_bonus' : 'parent_reset'
        });

        if (!error) {
            alert(`Successfully ${delta > 0 ? 'added' : 'removed'} ${Math.abs(delta)} stars!`);
        }
    };

    if (loading) return null;

    return (
        <div className="p-6 bg-white dark:bg-card-dark rounded-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">savings</span>
                Economy Settings
            </h3>

            <div className="space-y-6">
                {children.map((child) => {
                    const currentRate = interestSettings[child.id] || 0;

                    return (
                        <div key={child.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <h4 className="font-bold mb-3">{child.name}</h4>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-bold mb-2">
                                        Weekly Interest Rate: {currentRate}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        value={currentRate}
                                        onChange={(e) => handleRateChange(child.id, parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-text-sub-light dark:text-text-sub-dark mt-1">
                                        <span>0%</span>
                                        <span>5%</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const amount = prompt("How many bonus stars?");
                                            if (amount) {
                                                handleAdjustStars(child.id, parseInt(amount), "Parent bonus");
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Grant Bonus
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Reset ${child.name}'s stars to zero?`)) {
                                                handleAdjustStars(child.id, -999999, "Parent reset");
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Reset Stars
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Teaching Moment:</strong> Interest rewards saving! Set a rate to show how money grows over time.
                </p>
            </div>
        </div>
    );
}
