"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { AddTemplateModal } from "../components/AddTemplateModal";
import { AssignTemplateModal } from "../components/AssignTemplateModal";
import { ChildModeGuard } from "@/components/ChildModeGuard";

type TaskTemplate = Database['public']['Tables']['task_templates']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function TaskLibraryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [showAddTemplate, setShowAddTemplate] = useState(false);
    const [assignTemplate, setAssignTemplate] = useState<TaskTemplate | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profileData || profileData.role !== 'parent') {
            router.push("/parent/dashboard");
            return;
        }

        setProfile(profileData);

        if (profileData.family_id) {
            const { data: templatesData } = await supabase
                .from('task_templates')
                .select('*')
                .eq('family_id', profileData.family_id)
                .order('created_at', { ascending: false });

            setTemplates(templatesData || []);
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleTemplateActive = async (templateId: string, currentActive: boolean) => {
        const { error } = await supabase
            .from('task_templates')
            .update({ active: !currentActive })
            .eq('id', templateId);

        if (!error) {
            setTemplates(templates.map(t => t.id === templateId ? { ...t, active: !currentActive } : t));
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        const { error } = await supabase
            .from('task_templates')
            .delete()
            .eq('id', templateId);

        if (!error) {
            setTemplates(templates.filter(t => t.id !== templateId));
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse">Loading task library...</p>
                </div>
            </div>
        );
    }

    return (
        <ChildModeGuard>
            <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
                <ParentSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                    <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">T</div>
                            <span className="font-bold">Task For Time</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-text-main-light dark:text-text-main-dark transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main-light dark:text-text-main-dark">
                                    Task Library
                                </h1>
                                <p className="text-text-sub-light dark:text-text-sub-dark mt-1">
                                    Create reusable task templates and assign them to your children
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddTemplate(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-text-main-light font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm self-start"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                Create Template
                            </button>
                        </div>

                        {templates.length === 0 ? (
                            <div className="p-12 text-center bg-card-light dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">menu_book</span>
                                <p className="text-lg font-medium text-gray-500 mb-2">No task templates yet</p>
                                <p className="text-sm text-gray-400 mb-4">Create your first template to get started!</p>
                                <button
                                    onClick={() => setShowAddTemplate(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-text-main-light font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Create Your First Template
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map(template => (
                                    <div key={template.id} className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark pr-2">
                                                {template.title}
                                            </h3>
                                            <button
                                                onClick={() => toggleTemplateActive(template.id, template.active)}
                                                className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${template.active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}
                                            >
                                                {template.active ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">
                                                {template.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-bold text-primary">
                                                +{template.default_reward_minutes} mins
                                            </span>
                                            {template.category && (
                                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                                    {template.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setAssignTemplate(template)}
                                                className="flex-1 px-3 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => deleteTemplate(template.id)}
                                                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {profile?.family_id && (
                    <>
                        <AddTemplateModal
                            familyId={profile.family_id}
                            isOpen={showAddTemplate}
                            onClose={() => setShowAddTemplate(false)}
                            onTemplateAdded={fetchData}
                        />
                        <AssignTemplateModal
                            familyId={profile.family_id}
                            template={assignTemplate}
                            isOpen={!!assignTemplate}
                            onClose={() => setAssignTemplate(null)}
                            onAssigned={fetchData}
                        />
                    </>
                )}
            </div>
        </ChildModeGuard>
    );
}
