"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../../components/ParentSidebar";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import Link from "next/link";
import { AppAvatar } from "@/components/AppAvatar";

interface Outcome {
  id: string;
  title: string;
  description: string | null;
  template_type: string | null;
  success_criteria: string | null;
  weekly_target_days: number;
  active: boolean;
}

interface AssignedTask {
  id: string;
  title: string;
  child_id: string;
  status: string;
  children?: { name: string };
}

interface TaskTemplate {
  id: string;
  title: string;
  category: string | null;
}

export default function OutcomeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const outcomeId = params.outcomeId as string;

  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [mappedTasks, setMappedTasks] = useState<AssignedTask[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AssignedTask[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<TaskTemplate[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState("Parent");

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id, role, display_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      router.push("/login");
      return;
    }

    setUserId(user.id);
    setUserName(profile.display_name || "Parent");

    // Fetch outcome
    const { data: outcomeData } = await supabase
      .from('outcomes')
      .select('*')
      .eq('id', outcomeId)
      .single();

    if (outcomeData) {
      setOutcome(outcomeData);
    }

    // Fetch mapped tasks
    const { data: mappings } = await supabase
      .from('outcome_tasks')
      .select('assigned_task_id, task_template_id')
      .eq('outcome_id', outcomeId);

    const assignedTaskIds = (mappings || [])
      .map((m: any) => m.assigned_task_id)
      .filter(Boolean) as string[];

    if (assignedTaskIds.length > 0) {
      const { data: tasks } = await supabase
        .from('assigned_tasks')
        .select('*, children(name)')
        .in('id', assignedTaskIds);

      setMappedTasks((tasks || []) as AssignedTask[]);
    } else {
      setMappedTasks([]);
    }

    // Fetch all available tasks for mapping
    const { data: allTasks } = await supabase
      .from('assigned_tasks')
      .select('*, children(name)')
      .eq('family_id', profile.family_id)
      .not('id', 'in', `(${assignedTaskIds.join(',') || 'null'})`);

    setAvailableTasks((allTasks || []) as AssignedTask[]);

    // Fetch available templates
    const { data: templates } = await supabase
      .from('task_templates')
      .select('*')
      .eq('family_id', profile.family_id)
      .eq('active', true);

    setAvailableTemplates((templates || []) as TaskTemplate[]);

    setLoading(false);
  }, [outcomeId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMapTask = async (taskId: string) => {
    const { error } = await supabase.rpc('map_task_to_outcome', {
      p_outcome_id: outcomeId,
      p_assigned_task_id: taskId,
      p_task_template_id: null,
    });

    if (error) {
      console.error("Error mapping task:", error);
      alert("Failed to map task");
    } else {
      fetchData();
    }
  };

  const handleMapTemplate = async (templateId: string) => {
    const { error } = await supabase.rpc('map_task_to_outcome', {
      p_outcome_id: outcomeId,
      p_assigned_task_id: null,
      p_task_template_id: templateId,
    });

    if (error) {
      console.error("Error mapping template:", error);
      alert("Failed to map template");
    } else {
      fetchData();
    }
  };

  const handleUnmapTask = async (taskId: string) => {
    const { error } = await supabase
      .from('outcome_tasks')
      .delete()
      .eq('outcome_id', outcomeId)
      .eq('assigned_task_id', taskId);

    if (error) {
      console.error("Error unmapping task:", error);
      alert("Failed to unmap task");
    } else {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-bold animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!outcome) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Outcome not found</h2>
          <Link href="/parent/outcomes" className="text-primary hover:underline">
            Back to Outcomes
          </Link>
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
              <AppAvatar userId={userId || 'parent'} name={userName} size={32} style="notionists" className="rounded-lg" />
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
            <header className="flex flex-col gap-4">
              <Link
                href="/parent/outcomes"
                className="flex items-center gap-2 text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Outcomes
              </Link>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white mb-2">
                    {outcome.title}
                  </h1>
                  {outcome.description && (
                    <p className="text-text-sub-light dark:text-text-sub-dark text-lg mb-2">
                      {outcome.description}
                    </p>
                  )}
                  {outcome.success_criteria && (
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                      <span className="font-medium">Success:</span> {outcome.success_criteria}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Map Tasks
                </button>
              </div>
            </header>

            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">Mapped Tasks ({mappedTasks.length})</h2>
              {mappedTasks.length === 0 ? (
                <div className="text-center py-8 text-text-sub-light dark:text-text-sub-dark">
                  <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
                  <p>No tasks mapped yet. Click "Map Tasks" to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mappedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.children && (
                          <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                            {task.children.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnmapTask(task.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Unmap task"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {showMapModal && (
          <MapTasksModal
            outcomeId={outcomeId}
            availableTasks={availableTasks}
            availableTemplates={availableTemplates}
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            onMapTask={handleMapTask}
            onMapTemplate={handleMapTemplate}
          />
        )}
      </div>
    </ChildModeGuard>
  );
}

function MapTasksModal({
  outcomeId,
  availableTasks,
  availableTemplates,
  isOpen,
  onClose,
  onMapTask,
  onMapTemplate,
}: {
  outcomeId: string;
  availableTasks: AssignedTask[];
  availableTemplates: TaskTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onMapTask: (taskId: string) => void;
  onMapTemplate: (templateId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'templates'>('tasks');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Map Tasks to Outcome</h2>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'tasks'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            Assigned Tasks ({availableTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'templates'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            Templates ({availableTemplates.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'tasks' ? (
            availableTasks.length === 0 ? (
              <div className="text-center py-8 text-text-sub-light dark:text-text-sub-dark">
                <p>No available tasks to map.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.children && (
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                          {task.children.name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onMapTask(task.id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Map
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            availableTemplates.length === 0 ? (
              <div className="text-center py-8 text-text-sub-light dark:text-text-sub-dark">
                <p>No available templates to map.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{template.title}</p>
                      {template.category && (
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark">
                          {template.category}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onMapTemplate(template.id);
                        onClose();
                      }}
                      className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Map
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

