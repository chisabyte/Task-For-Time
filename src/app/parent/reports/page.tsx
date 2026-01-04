"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import { PremiumGate } from "@/components/PremiumGate";

interface WeeklyReport {
  family_id: string;
  week_start: string;
  week_end: string;
  children: any[];
  consistency_score: number;
  wins: any[];
  challenges: any[];
  generated_at: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [weekStart, setWeekStart] = useState<string>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  });

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        setLoading(false);
        setGenerating(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'parent') {
        router.push("/login");
        setLoading(false);
        setGenerating(false);
        return;
      }

      const { data, error } = await supabase.rpc('generate_weekly_report', {
        p_family_id: profile.family_id,
        p_week_start: weekStart,
      });

      if (error) throw error;
      setReport(data);
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }, [weekStart, router]);

  useEffect(() => {
    generateReport();
  }, [generateReport]); // Generate on mount

  const handleExport = async () => {
    if (!report) return;

    try {
      // Create a simple text/HTML report
      const reportText = `
WEEKLY REPORT
Week: ${new Date(report.week_start).toLocaleDateString()} - ${new Date(report.week_end).toLocaleDateString()}

Consistency Score: ${report.consistency_score.toFixed(1)}%

${report.children.map((child: any) => `
CHILD: ${child.child_name}
${child.outcomes.map((outcome: any) => `
  Outcome: ${outcome.outcome_title}
  Completion Rate: ${outcome.completion_rate?.toFixed(1) || 0}%
  On-Time Rate: ${outcome.on_time_rate?.toFixed(1) || 0}%
  Streak: ${outcome.streak_days || 0} days
`).join('')}
`).join('')}

Generated: ${new Date(report.generated_at).toLocaleString()}
      `.trim();

      // Create blob and download
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-report-${report.week_start}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-bold animate-pulse">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <ChildModeGuard>
      <PremiumGate featureName="reports">
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
          <ParentSidebar />
          <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
            <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                  Weekly Reports
                </h1>
                <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                  Track progress, celebrate wins, and identify areas for improvement.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
                <button
                  onClick={generateReport}
                  disabled={generating}
                  className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
                {report && (
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Export
                  </button>
                )}
              </div>
            </header>

            {report ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Week Summary</h2>
                    <div className="text-right">
                      <div className="text-sm text-text-sub-light dark:text-text-sub-dark">Consistency Score</div>
                      <div className="text-3xl font-black text-primary">
                        {report.consistency_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-text-sub-light dark:text-text-sub-dark">
                    Week of {new Date(report.week_start).toLocaleDateString()} - {new Date(report.week_end).toLocaleDateString()}
                  </div>
                </div>

                {/* Children Outcomes */}
                {report.children.map((child: any) => (
                  <div
                    key={child.child_id}
                    className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 className="text-xl font-bold mb-4">{child.child_name}</h3>
                    {child.outcomes && child.outcomes.length > 0 ? (
                      <div className="space-y-4">
                        {child.outcomes.map((outcome: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <h4 className="font-bold mb-2">{outcome.outcome_title}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-text-sub-light dark:text-text-sub-dark">Completion</div>
                                <div className="font-bold text-lg">
                                  {outcome.completion_rate?.toFixed(1) || 0}%
                                </div>
                              </div>
                              <div>
                                <div className="text-text-sub-light dark:text-text-sub-dark">On-Time</div>
                                <div className="font-bold text-lg">
                                  {outcome.on_time_rate?.toFixed(1) || 0}%
                                </div>
                              </div>
                              <div>
                                <div className="text-text-sub-light dark:text-text-sub-dark">Streak</div>
                                <div className="font-bold text-lg">
                                  {outcome.streak_days || 0} days
                                </div>
                              </div>
                              <div>
                                <div className="text-text-sub-light dark:text-text-sub-dark">Tasks</div>
                                <div className="font-bold text-lg">
                                  {outcome.completed_tasks || 0}/{outcome.assigned_tasks || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-sub-light dark:text-text-sub-dark">
                        No outcomes data for this week.
                      </p>
                    )}
                  </div>
                ))}

                {/* Wins & Challenges */}
                {(report.wins && report.wins.length > 0) || (report.challenges && report.challenges.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.wins && report.wins.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                        <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-400">
                          <span className="material-symbols-outlined align-middle mr-2">celebration</span>
                          Wins
                        </h3>
                        <ul className="space-y-2">
                          {report.wins.map((win: any, idx: number) => (
                            <li key={idx} className="text-green-700 dark:text-green-300">
                              {win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.challenges && report.challenges.length > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
                        <h3 className="text-xl font-bold mb-4 text-orange-800 dark:text-orange-400">
                          <span className="material-symbols-outlined align-middle mr-2">trending_down</span>
                          Challenges
                        </h3>
                        <ul className="space-y-2">
                          {report.challenges.map((challenge: any, idx: number) => (
                            <li key={idx} className="text-orange-700 dark:text-orange-300">
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">assessment</span>
                <h3 className="text-xl font-bold mb-2">No report generated</h3>
                <p className="text-text-sub-light dark:text-text-sub-dark mb-6">
                  Click &quot;Generate&quot; to create a weekly report.
                </p>
              </div>
            )}
            </div>
          </main>
        </div>
      </PremiumGate>
    </ChildModeGuard>
  );
}

