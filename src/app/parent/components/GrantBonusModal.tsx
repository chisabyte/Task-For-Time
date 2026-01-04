"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Child = Database['public']['Tables']['children']['Row'];

interface GrantBonusModalProps {
    familyId: string;
    isOpen: boolean;
    onClose: () => void;
    onBonusGranted: () => void;
}

export function GrantBonusModal({ familyId, isOpen, onClose, onBonusGranted }: GrantBonusModalProps) {
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>("");
    const [bonusMinutes, setBonusMinutes] = useState(15);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchChildren();
        }
    }, [isOpen, familyId]);

    const fetchChildren = async () => {
        const { data } = await supabase
            .from('children')
            .select('*')
            .eq('family_id', familyId)
            .is('deleted_at', null);
        
        if (data && data.length > 0) {
            setChildren(data);
            setSelectedChildId(data[0].id);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedChildId) {
            setError("Please select a child");
            setLoading(false);
            return;
        }

        try {
            // Get current child data
            const { data: child, error: fetchError } = await supabase
                .from('children')
                .select('time_bank_minutes, xp')
                .eq('id', selectedChildId)
                .single();

            if (fetchError) throw fetchError;

            // Update child's time bank and XP
            const { error: updateError } = await supabase
                .from('children')
                .update({
                    time_bank_minutes: (child?.time_bank_minutes || 0) + bonusMinutes,
                    xp: (child?.xp || 0) + 5 // Small XP bonus
                })
                .eq('id', selectedChildId);

            if (updateError) throw updateError;

            // Reset form
            setBonusMinutes(15);
            setReason("");
            
            onBonusGranted();
            onClose();
        } catch (err: any) {
            console.error("Error granting bonus:", err);
            setError(err.message || "Failed to grant bonus");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">star</span>
                        Grant Bonus Time
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {children.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No children added yet.</p>
                        <p className="text-sm mt-2">Add a child first to grant bonus time.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="selectChild" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Select Child
                            </label>
                            <select
                                id="selectChild"
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="bonusMinutes" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Bonus Time (minutes)
                            </label>
                            <input
                                type="number"
                                id="bonusMinutes"
                                value={bonusMinutes}
                                onChange={(e) => setBonusMinutes(parseInt(e.target.value) || 0)}
                                min={1}
                                max={120}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Reason (optional)
                            </label>
                            <input
                                type="text"
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="e.g., Great behavior today!"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                {loading ? "Granting..." : "Grant Bonus"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

