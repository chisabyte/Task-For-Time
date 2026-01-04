"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Child = Database['public']['Tables']['children']['Row'];
type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];

interface AssignTemplateModalProps {
    familyId: string;
    template: TaskTemplate | null;
    isOpen: boolean;
    onClose: () => void;
    onAssigned: () => void;
}

export function AssignTemplateModal({ familyId, template, isOpen, onClose, onAssigned }: AssignTemplateModalProps) {
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
    const [rewardMinutes, setRewardMinutes] = useState(15);
    const [loading, setLoading] = useState(false);
    const [loadingChildren, setLoadingChildren] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch children when modal opens
    useEffect(() => {
        if (isOpen && template) {
            fetchChildren();
            setRewardMinutes(template.default_reward_minutes);
        }
    }, [isOpen, template, familyId]);

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
                setSelectedChildIds([childrenList[0].id]);
            }
        } catch (err) {
            console.error("Error fetching children:", err);
            setError("Failed to load children");
        } finally {
            setLoadingChildren(false);
        }
    };

    const resetForm = () => {
        setSelectedChildIds([]);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const toggleChild = (childId: string) => {
        setSelectedChildIds(prev => 
            prev.includes(childId) 
                ? prev.filter(id => id !== childId)
                : [...prev, childId]
        );
    };

    const selectAll = () => {
        setSelectedChildIds(children.map(c => c.id));
    };

    const deselectAll = () => {
        setSelectedChildIds([]);
    };

    if (!isOpen || !template) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (selectedChildIds.length === 0) {
            setError("Please select at least one child");
            setLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Create assigned tasks for each selected child
            const assignedTasks = selectedChildIds.map(childId => ({
                family_id: familyId,
                child_id: childId,
                template_id: template.id,
                title: template.title,
                description: template.description,
                category: template.category,
                reward_minutes: rewardMinutes,
                requires_approval: template.requires_approval,
                status: 'active' as const,
                created_by: user?.id || null
            }));

            console.log('[AssignTemplateModal] Inserting tasks:', assignedTasks);
            
            const { data: insertedData, error: insertError } = await supabase
                .from('assigned_tasks')
                .insert(assignedTasks)
                .select();

            if (insertError) {
                console.error('[AssignTemplateModal] Insert error:', insertError);
                if (insertError.message.includes('child_id')) {
                    throw new Error("A child must be selected to assign a task");
                }
                throw insertError;
            }

            console.log('[AssignTemplateModal] Successfully inserted tasks:', insertedData);

            resetForm();
            onAssigned();
            onClose();
        } catch (err: any) {
            console.error("Error assigning template:", err);
            setError(err.message || "Failed to assign task");
        } finally {
            setLoading(false);
        }
    };

    const hasNoChildren = !loadingChildren && children.length === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                            Assign Task
                        </h2>
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark mt-1">
                            Select children to assign this task to
                        </p>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Template info */}
                <div className="mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <h3 className="font-bold text-text-main-light dark:text-text-main-dark mb-1">
                        {template.title}
                    </h3>
                    {template.description && (
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-2">
                            {template.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-primary">+{template.default_reward_minutes} mins</span>
                        {template.category && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                {template.category}
                            </span>
                        )}
                    </div>
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
                                    Add a child first to assign tasks.
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
                        {/* Child Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark">
                                    Assign to *
                                </label>
                                {children.length > 1 && (
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={selectAll}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Select all
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button 
                                            type="button" 
                                            onClick={deselectAll}
                                            className="text-xs text-gray-500 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {loadingChildren ? (
                                <div className="flex items-center gap-2 text-text-sub-light dark:text-text-sub-dark py-4">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    <span className="text-sm">Loading children...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {children.map(child => (
                                        <label 
                                            key={child.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                                selectedChildIds.includes(child.id)
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedChildIds.includes(child.id)}
                                                onChange={() => toggleChild(child.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div className="flex items-center gap-2">
                                                <img 
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(child.id || child.name)}&size=32&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                                    alt={child.name}
                                                    className="h-8 w-8 rounded-full border border-primary/30 shadow-sm bg-gray-100 dark:bg-gray-800 object-cover"
                                                />
                                                <span className="font-medium text-text-main-light dark:text-text-main-dark">
                                                    {child.name}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reward override */}
                        <div>
                            <label htmlFor="assignRewardMinutes" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                Reward (minutes)
                            </label>
                            <input
                                type="number"
                                id="assignRewardMinutes"
                                value={rewardMinutes}
                                onChange={(e) => setRewardMinutes(parseInt(e.target.value) || 0)}
                                min={1}
                                max={240}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <p className="text-xs text-text-sub-light dark:text-text-sub-dark mt-1">
                                Default: {template.default_reward_minutes} minutes
                            </p>
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
                                disabled={loading || selectedChildIds.length === 0}
                                className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Assigning..." : `Assign to ${selectedChildIds.length} ${selectedChildIds.length === 1 ? 'child' : 'children'}`}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

