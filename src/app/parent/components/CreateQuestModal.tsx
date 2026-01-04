"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CreateQuestModalProps {
    familyId: string;
    isOpen: boolean;
    onClose: () => void;
    onQuestCreated: () => void;
}

export function CreateQuestModal({ familyId, isOpen, onClose, onQuestCreated }: CreateQuestModalProps) {
    const [title, setTitle] = useState("");
    const [rewardDescription, setRewardDescription] = useState("");
    const [targetRate, setTargetRate] = useState(80);
    const [durationDays, setDurationDays] = useState(7);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);

        const { error } = await supabase
            .from('family_quests')
            .insert({
                family_id: familyId,
                title,
                reward_description: rewardDescription,
                target_completion_rate: targetRate,
                end_date: endDate.toISOString(),
            });

        setLoading(false);

        if (!error) {
            setTitle("");
            setRewardDescription("");
            setTargetRate(80);
            setDurationDays(7);
            onQuestCreated();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">flag</span>
                        Create Family Quest
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Quest Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Weekend Warriors Challenge"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Reward (Real-World)</label>
                        <input
                            type="text"
                            value={rewardDescription}
                            onChange={(e) => setRewardDescription(e.target.value)}
                            placeholder="e.g., Pizza Movie Night 🍕"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">
                            Target Completion: {targetRate}%
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            step="5"
                            value={targetRate}
                            onChange={(e) => setTargetRate(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-text-sub-light dark:text-text-sub-dark mt-1">
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Duration</label>
                        <select
                            value={durationDays}
                            onChange={(e) => setDurationDays(parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value={3}>3 Days</option>
                            <option value={7}>1 Week</option>
                            <option value={14}>2 Weeks</option>
                            <option value={30}>1 Month</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Quest"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
