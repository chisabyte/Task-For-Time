"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CreateSavingsGoalModalProps {
    childId: string;
    isOpen: boolean;
    onClose: () => void;
    onGoalCreated: () => void;
}

export function CreateSavingsGoalModal({ childId, isOpen, onClose, onGoalCreated }: CreateSavingsGoalModalProps) {
    const [title, setTitle] = useState("");
    const [targetStars, setTargetStars] = useState(100);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('savings_goals')
            .insert({
                child_id: childId,
                title,
                target_stars: targetStars,
            });

        setLoading(false);

        if (!error) {
            setTitle("");
            setTargetStars(100);
            onGoalCreated();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <span className="text-3xl">🎯</span>
                        New Savings Goal
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
                        <label className="block text-sm font-bold mb-2">What are you saving for?</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., New Bike, Video Game, Special Toy"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">
                            How many stars? {targetStars.toLocaleString()} ⭐
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={targetStars}
                            onChange={(e) => setTargetStars(parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-text-sub-light dark:text-text-sub-dark mt-1">
                            <span>50</span>
                            <span>1000</span>
                        </div>
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
                            className="flex-1 px-4 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Goal"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
