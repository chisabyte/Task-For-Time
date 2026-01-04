"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AddTemplateModalProps {
    familyId: string;
    isOpen: boolean;
    onClose: () => void;
    onTemplateAdded: () => void;
}

const CATEGORIES = [
    "Chores",
    "Homework",
    "Reading",
    "Exercise",
    "Music Practice",
    "Helping Others",
    "Creative",
    "Other"
];

export function AddTemplateModal({ familyId, isOpen, onClose, onTemplateAdded }: AddTemplateModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [defaultRewardMinutes, setDefaultRewardMinutes] = useState(15);
    const [category, setCategory] = useState("Chores");
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDefaultRewardMinutes(15);
        setCategory("Chores");
        setRequiresApproval(true);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!title.trim()) {
            setError("Please enter a task title");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error: insertError } = await supabase
                .from('task_templates')
                .insert({
                    family_id: familyId,
                    title: title.trim(),
                    description: description.trim() || null,
                    default_reward_minutes: defaultRewardMinutes,
                    category: category,
                    requires_approval: requiresApproval,
                    active: true,
                    created_by: user?.id || null
                });

            if (insertError) throw insertError;

            resetForm();
            onTemplateAdded();
            onClose();
        } catch (err: any) {
            console.error("Error adding template:", err);
            setError(err.message || "Failed to add template");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                            Create Task Template
                        </h2>
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark mt-1">
                            Templates can be assigned to children later
                        </p>
                    </div>
                    <button 
                        onClick={handleClose}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="templateTitle" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            id="templateTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="e.g., Clean your room"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="templateDescription" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            id="templateDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                            placeholder="Add details about the task..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="defaultRewardMinutes" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Default Reward (min)
                            </label>
                            <input
                                type="number"
                                id="defaultRewardMinutes"
                                value={defaultRewardMinutes}
                                onChange={(e) => setDefaultRewardMinutes(parseInt(e.target.value) || 0)}
                                min={1}
                                max={240}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label htmlFor="templateCategory" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Category
                            </label>
                            <select
                                id="templateCategory"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <input
                            type="checkbox"
                            id="templateRequiresApproval"
                            checked={requiresApproval}
                            onChange={(e) => setRequiresApproval(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="templateRequiresApproval" className="text-sm text-text-main-light dark:text-text-main-dark">
                            Requires parent approval before rewarding time
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Template"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

