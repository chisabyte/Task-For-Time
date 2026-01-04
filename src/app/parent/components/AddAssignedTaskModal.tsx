"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Child = Database['public']['Tables']['children']['Row'];

interface AddAssignedTaskModalProps {
    familyId: string;
    isOpen: boolean;
    onClose: () => void;
    onTaskAdded: () => void;
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

export function AddAssignedTaskModal({ familyId, isOpen, onClose, onTaskAdded }: AddAssignedTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rewardMinutes, setRewardMinutes] = useState(15);
    const [category, setCategory] = useState("Chores");
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Child selection state
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>("");
    const [loadingChildren, setLoadingChildren] = useState(true);

    // Fetch children when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchChildren();
        }
    }, [isOpen, familyId]);

    const fetchChildren = async () => {
        setLoadingChildren(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('children')
                .select('*')
                .eq('family_id', familyId)
                .is('deleted_at', null)
                .order('name');

            if (fetchError) throw fetchError;

            const childrenList = data || [];
            setChildren(childrenList);
            
            // Auto-select if only 1 child
            if (childrenList.length === 1) {
                setSelectedChildId(childrenList[0].id);
            } else {
                setSelectedChildId("");
            }
        } catch (err) {
            console.error("Error fetching children:", err);
            setError("Failed to load children");
        } finally {
            setLoadingChildren(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setRewardMinutes(15);
        setCategory("Chores");
        setRequiresApproval(true);
        setError(null);
        if (children.length !== 1) {
            setSelectedChildId("");
        }
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

        // Validation
        if (!title.trim()) {
            setError("Please enter a task title");
            setLoading(false);
            return;
        }

        if (!selectedChildId) {
            setError("Please select a child to assign this task to");
            setLoading(false);
            return;
        }

        try {
            // Get current user for created_by
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error: insertError } = await supabase
                .from('assigned_tasks')
                .insert({
                    family_id: familyId,
                    child_id: selectedChildId,
                    title: title.trim(),
                    description: description.trim() || null,
                    reward_minutes: rewardMinutes,
                    category: category,
                    requires_approval: requiresApproval,
                    status: 'active',
                    created_by: user?.id || null
                });

            if (insertError) {
                // Handle specific error for missing child_id
                if (insertError.message.includes('child_id')) {
                    throw new Error("A child must be selected to create a task");
                }
                throw insertError;
            }

            resetForm();
            onTaskAdded();
            onClose();
        } catch (err: any) {
            console.error("Error adding assigned task:", err);
            setError(err.message || "Failed to add task");
        } finally {
            setLoading(false);
        }
    };

    // No children state
    const hasNoChildren = !loadingChildren && children.length === 0;
    // Single child (auto-selected, hide dropdown)
    const hasSingleChild = children.length === 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                        Assign New Task
                    </h2>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* No children warning */}
                {hasNoChildren && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">warning</span>
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                                    No children in your family
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    You need to add a child first before you can assign tasks.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="mt-4 w-full px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {!hasNoChildren && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Child Selection - Required, shown first */}
                        {!hasSingleChild && (
                            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border-2 border-primary/20 dark:border-primary/30">
                                <label htmlFor="childSelect" className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                                        Assign to Child *
                                    </span>
                                </label>
                                {loadingChildren ? (
                                    <div className="flex items-center gap-2 text-text-sub-light dark:text-text-sub-dark">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        <span className="text-sm">Loading children...</span>
                                    </div>
                                ) : (
                                    <select
                                        id="childSelect"
                                        value={selectedChildId}
                                        onChange={(e) => setSelectedChildId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary font-medium"
                                        required
                                    >
                                        <option value="">Select a child...</option>
                                        {children.map(child => (
                                            <option key={child.id} value={child.id}>
                                                {child.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Single child indicator */}
                        {hasSingleChild && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Assigning to <span className="font-bold">{children[0].name}</span>
                                </p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="taskTitle" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                id="taskTitle"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="e.g., Clean your room"
                                autoFocus={hasSingleChild}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="taskDescription" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Description (optional)
                            </label>
                            <textarea
                                id="taskDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                placeholder="Add details about the task..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="rewardMinutes" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                    Reward (minutes)
                                </label>
                                <input
                                    type="number"
                                    id="rewardMinutes"
                                    value={rewardMinutes}
                                    onChange={(e) => setRewardMinutes(parseInt(e.target.value) || 0)}
                                    min={1}
                                    max={240}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                    Category
                                </label>
                                <select
                                    id="category"
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
                                id="requiresApproval"
                                checked={requiresApproval}
                                onChange={(e) => setRequiresApproval(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="requiresApproval" className="text-sm text-text-main-light dark:text-text-main-dark">
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
                                disabled={loading || !selectedChildId}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Assigning..." : "Assign Task"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

