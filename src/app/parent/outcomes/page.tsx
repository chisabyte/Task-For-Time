"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import Link from "next/link";

interface Outcome {
  id: string;
  title: string;
  description: string | null;
  template_type: string | null;
  success_criteria: string | null;
  weekly_target_days: number;
  active: boolean;
  created_at: string;
}

export default function OutcomesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);

  const fetchOutcomes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      router.push("/login");
      return;
    }

    setFamilyId(profile.family_id);

    const { data, error } = await supabase
      .from('outcomes')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching outcomes:", error);
    } else {
      setOutcomes(data || []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchOutcomes();
  }, [fetchOutcomes]);

  const handleDelete = async (outcomeId: string) => {
    if (!confirm("Are you sure you want to delete this outcome? This will not delete the tasks, only the outcome mapping.")) {
      return;
    }

    const { error } = await supabase
      .from('outcomes')
      .delete()
      .eq('id', outcomeId);

    if (error) {
      console.error("Error deleting outcome:", error);
      alert("Failed to delete outcome");
    } else {
      fetchOutcomes();
    }
  };

  const handleToggleActive = async (outcome: Outcome) => {
    const { error } = await supabase
      .from('outcomes')
      .update({ active: !outcome.active })
      .eq('id', outcome.id);

    if (error) {
      console.error("Error updating outcome:", error);
      alert("Failed to update outcome");
    } else {
      fetchOutcomes();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-bold animate-pulse">Loading outcomes...</p>
        </div>
      </div>
    );
  }

  return (
    <ChildModeGuard>
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
        <ParentSidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
          <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">P</div>
              <span className="font-bold">Task For Time</span>
            </div>
          </div>

          <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                  Behavior Outcomes
                </h1>
                <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                  Track behavior goals, not just tasks. Map tasks to outcomes and measure real progress.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingOutcome(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Create Outcome
              </button>
            </header>

            {outcomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">track_changes</span>
                <h3 className="text-xl font-bold mb-2">No outcomes yet</h3>
                <p className="text-text-sub-light dark:text-text-sub-dark mb-6 text-center max-w-md">
                  Create your first outcome to start tracking behavior goals. Outcomes help you see the bigger picture beyond individual tasks.
                </p>
                <button
                  onClick={() => {
                    setEditingOutcome(null);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Create Your First Outcome
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className={`bg-card-light dark:bg-card-dark rounded-xl border-2 p-6 flex flex-col gap-4 ${
                      outcome.active
                        ? 'border-primary/30 dark:border-primary/50'
                        : 'border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{outcome.title}</h3>
                        {outcome.description && (
                          <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-2">
                            {outcome.description}
                          </p>
                        )}
                        {outcome.success_criteria && (
                          <p className="text-xs text-text-sub-light dark:text-text-sub-dark italic">
                            Success: {outcome.success_criteria}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleActive(outcome)}
                        className={`p-2 rounded-lg transition-colors ${
                          outcome.active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        title={outcome.active ? 'Active' : 'Inactive'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {outcome.active ? 'check_circle' : 'cancel'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-text-sub-light dark:text-text-sub-dark">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      <span>Target: {outcome.weekly_target_days} days/week</span>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/parent/outcomes/${outcome.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary font-medium rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                      >
                        Manage Tasks
                      </Link>
                      <button
                        onClick={() => handleDelete(outcome.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete outcome"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {showCreateModal && (
          <CreateOutcomeModal
            familyId={familyId}
            outcome={editingOutcome}
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingOutcome(null);
            }}
            onSuccess={fetchOutcomes}
          />
        )}
      </div>
    </ChildModeGuard>
  );
}

function CreateOutcomeModal({
  familyId,
  outcome,
  isOpen,
  onClose,
  onSuccess,
}: {
  familyId: string | null;
  outcome: Outcome | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState<string>("custom");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [weeklyTargetDays, setWeeklyTargetDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (outcome) {
      setTitle(outcome.title);
      setDescription(outcome.description || "");
      setTemplateType(outcome.template_type || "custom");
      setSuccessCriteria(outcome.success_criteria || "");
      setWeeklyTargetDays(outcome.weekly_target_days);
    } else {
      setTitle("");
      setDescription("");
      setTemplateType("custom");
      setSuccessCriteria("");
      setWeeklyTargetDays(5);
    }
  }, [outcome, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title");
      setLoading(false);
      return;
    }

    if (!familyId) {
      setError("Family ID not found");
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('upsert_outcome', {
        p_id: outcome?.id || null,
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_template_type: templateType === 'custom' ? null : templateType,
        p_success_criteria: successCriteria.trim() || null,
        p_weekly_target_days: weeklyTargetDays,
        p_active: true,
      });

      if (rpcError) throw rpcError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving outcome:", err);
      setError(err.message || "Failed to save outcome");
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { value: 'morning_routine', label: 'Morning Routine' },
    { value: 'homework', label: 'Homework' },
    { value: 'bedtime', label: 'Bedtime' },
    { value: 'chores', label: 'Chores' },
    { value: 'kindness', label: 'Kindness' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">
            {outcome ? 'Edit Outcome' : 'Create New Outcome'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="e.g., Morning routine without reminders"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              rows={3}
              placeholder="What does this outcome mean for your family?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Template Type</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {templates.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Success Criteria</label>
            <input
              type="text"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="e.g., Complete all 3 tasks before 8am"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Weekly Target: {weeklyTargetDays} days
            </label>
            <input
              type="range"
              min="0"
              max="7"
              value={weeklyTargetDays}
              onChange={(e) => setWeeklyTargetDays(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : outcome ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

