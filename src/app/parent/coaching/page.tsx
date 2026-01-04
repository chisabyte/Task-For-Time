"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import { PremiumGate } from "@/components/PremiumGate";

interface Child {
  id: string;
  name: string;
  displayName?: string;
  display_name?: string;
  firstName?: string;
  first_name?: string;
  nickname?: string;
}

interface Outcome {
  id: string;
  title: string;
}

interface CoachInsight {
  id: string;
  title: string;
  observation: string;
  diagnosis: string;
  recommendation: string;
  expected_result: string;
  next_check: string;
  impact_score: number;
  week_start: string;
  created_at: string;
  created_by: string;
  source_metrics: any;
  child_id?: string | null;
  scope?: string;
}

interface CoachingInsight {
  observation: string;
  diagnosis: string;
  recommendation: string;
  expected_result: string;
  next_check: string;
  impact_score: number;
}

/**
 * Get child label from child object, with fallback priority order
 */
function getChildLabel(child: Child | undefined | null, fallbackLabel: string = "this child"): string {
  if (!child) return fallbackLabel;
  
  // Priority order: displayName, display_name, name, firstName, first_name, nickname
  const label = child.displayName || child.display_name || child.name || child.firstName || child.first_name || child.nickname;
  return label && label.trim() ? label.trim() : fallbackLabel;
}

/**
 * Get child name by ID from children array
 */
function getChildNameById(children: Child[], childId: string | null | undefined): string | null {
  if (!childId) return null;
  const child = children.find(c => c.id === childId);
  return child ? getChildLabel(child, "this child") : null;
}

/**
 * UUID regex pattern for matching UUIDs in text
 */
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}/gi;

/**
 * Sanitize insight text to replace UUIDs and "child ID" patterns with child names
 */
function sanitizeInsightText(text: string, children: Child[], childId?: string | null): string {
  if (!text) return text;
  
  let sanitized = text;
  const childName = childId ? getChildNameById(children, childId) || "this child" : "this child";
  
  // Replace "child ID" patterns with child name
  const childIdPattern = /child\s+ID\s*["']?[0-9a-fA-F-]{16,}["']?/gi;
  sanitized = sanitized.replace(childIdPattern, childName);
  
  // Replace UUID patterns with child name (if childId provided) or remove them
  const uuidMatches = sanitized.match(UUID_REGEX);
  if (uuidMatches && uuidMatches.length > 0) {
    if (childId) {
      sanitized = sanitized.replace(UUID_REGEX, childName);
    } else {
      // If no childId, just remove UUIDs
      sanitized = sanitized.replace(UUID_REGEX, '');
    }
  }
  
  // Dev warning for remaining UUIDs (check again after replacement)
  if (process.env.NODE_ENV !== "production") {
    const remainingUuids = sanitized.match(UUID_REGEX);
    if (remainingUuids && remainingUuids.length > 0) {
      console.warn('[AI Coach] UUID detected in sanitized text after replacement:', sanitized.substring(0, 100));
    }
  }
  
  return sanitized.trim();
}

/**
 * Check if insight needs sanitization
 */
function needsSanitization(insight: { observation?: string; diagnosis?: string; recommendation?: string } | null): boolean {
  if (!insight) return false;
  const text = `${insight.observation || ''} ${insight.diagnosis || ''} ${insight.recommendation || ''}`.toLowerCase();
  return /child\s+id|no specific behavior data|no data available|uuid/.test(text) || UUID_REGEX.test(text);
}

export default function CoachingPage() {
  const router = useRouter();
  const advancedSectionRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [currentWeekInsight, setCurrentWeekInsight] = useState<CoachInsight | null>(null);
  const [insightHistory, setInsightHistory] = useState<CoachInsight[]>([]);
  const [manualInsights, setManualInsights] = useState<CoachingInsight | null>(null);
  const [signals, setSignals] = useState<any>({});
  const [metrics, setMetrics] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[CoachingPage] Auth error:', userError);
        router.push("/login");
        setLoading(false);
        return;
      }
      
      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('family_id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[CoachingPage] Profile fetch error:', profileError);
        router.push("/login");
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== 'parent') {
        router.push("/login");
        setLoading(false);
        return;
      }

      setFamilyId(profile.family_id);

    // Fetch children
    const { data: childrenData } = await supabase
      .from('children')
      .select('id, name')
      .eq('family_id', profile.family_id)
      .is('deleted_at', null);

    setChildren(childrenData || []);

    // Fetch outcomes
    const { data: outcomesData } = await supabase
      .from('outcomes')
      .select('id, title')
      .eq('family_id', profile.family_id)
      .eq('active', true);

    setOutcomes(outcomesData || []);

    // Get current week start (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const currentWeekStart = monday.toISOString().split('T')[0];

    // Fetch current week's automatic insight (prefer family-scoped, fallback to child-scoped)
    const { data: currentWeekData, error: currentWeekError } = await supabase
      .from('coach_insights')
      .select('*')
      .eq('family_id', profile.family_id)
      .eq('scope', 'family')
      .eq('week_start', currentWeekStart)
      .eq('created_by', 'system')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentWeekError) {
      console.error('[CoachingPage] Error fetching current week insight:', currentWeekError);
    }

    setCurrentWeekInsight(currentWeekData || null);

    // Fetch insight history (last 8, excluding current week, include all scopes)
    const { data: historyData } = await supabase
      .from('coach_insights')
      .select('*')
      .eq('family_id', profile.family_id)
      .neq('week_start', currentWeekStart)
      .order('week_start', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8);

      setInsightHistory(historyData || []);

      setLoading(false);
    } catch (error) {
      console.error('[CoachingPage] Unexpected error in fetchData:', error);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCoaching = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/coaching/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          childId: selectedChildId,
          outcomeId: selectedOutcomeId,
          lookbackDays: 14,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate coaching';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          errorMessage = `Request failed (${response.status} ${response.statusText}): ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setManualInsights(data.insights);
      setSignals(data.signals);
      setMetrics(data.metrics);

      // Store insight in database as manual
      if (familyId && data.insights) {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.toISOString().split('T')[0];

        await supabase.from('coach_insights').insert({
          family_id: familyId,
          scope: selectedChildId ? 'child' : 'family',
          child_id: selectedChildId || null,
          week_start: weekStart,
          outcome_filter: selectedOutcomeId || null,
          title: data.insights.observation?.substring(0, 100) || 'Manual Analysis',
          observation: data.insights.observation,
          diagnosis: data.insights.diagnosis,
          recommendation: data.insights.recommendation,
          expected_result: data.insights.expected_result,
          next_check: data.insights.next_check,
          impact_score: data.insights.impact_score || 0,
          created_by: 'manual',
          source_metrics: data.metrics || {},
        });

        // Refresh data
        fetchData();
      }
    } catch (error: any) {
      console.error('Error generating coaching:', error);
      alert('Failed to generate coaching: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const scrollToAdvanced = () => {
    advancedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Open the details element
    const details = advancedSectionRef.current?.querySelector('details');
    if (details) {
      details.open = true;
    }
  };

  // Determine which insight to show in Latest Insight section
  const displayInsight = currentWeekInsight || (manualInsights ? {
    title: manualInsights.observation?.substring(0, 100) || 'Manual Analysis',
    observation: manualInsights.observation || '',
    diagnosis: manualInsights.diagnosis || '',
    recommendation: manualInsights.recommendation || '',
    expected_result: manualInsights.expected_result || '',
    next_check: manualInsights.next_check || '',
    impact_score: manualInsights.impact_score || 0,
    created_by: 'manual',
    created_at: new Date().toISOString(),
    child_id: selectedChildId,
    scope: selectedChildId ? 'child' : 'family',
  } as CoachInsight : null);

  // Get child labels using helper function
  const selectedChildName = selectedChildId ? getChildNameById(children, selectedChildId) : null;
  const displayInsightChildName = displayInsight?.child_id ? getChildNameById(children, displayInsight.child_id) : null;
  const displayScopeLabel = displayInsight?.scope === 'child' 
    ? (displayInsightChildName || "this child")
    : 'Family';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-bold animate-pulse">Loading coaching...</p>
        </div>
      </div>
    );
  }

  return (
    <ChildModeGuard>
      <PremiumGate featureName="coaching">
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
          <ParentSidebar />
          <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
            <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
            {/* A) Page Header */}
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-teal-900 dark:text-white">
                  AI Coach
              </h1>
              <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium">
                  Automatic insights from your family's patterns. Updated weekly.
              </p>
              </div>
              <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold">
                Auto
              </div>
            </header>

            {/* B) Latest Insight Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">Latest Insight</h2>
              {displayInsight ? (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border-2 border-primary/30 dark:border-primary/50 p-6">
                  {/* Meta row */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-sm text-text-sub-light dark:text-text-sub-dark">
                    <span>Scope: {displayScopeLabel}</span>
                    <span>•</span>
                    <span>Status: {displayInsight.created_by === 'system' ? 'Auto-generated' : 'Generated manually'}</span>
                    {displayInsight.created_at && (
                      <>
                        <span>•</span>
                        <span>Last updated: {new Date(displayInsight.created_at).toLocaleDateString()} {new Date(displayInsight.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {displayInsight.created_by === 'system' && (
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold uppercase">
                            Auto-Generated
                          </span>
                        )}
                        {displayInsight.week_start && (
                          <span className="text-sm text-text-sub-light dark:text-text-sub-dark">
                            Week of {new Date(displayInsight.week_start).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold">{sanitizeInsightText(displayInsight.title, children, displayInsight.child_id)}</h3>
                    </div>
                    <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold">
                      Impact: {displayInsight.impact_score}/100
                    </div>
                  </div>

                  {needsSanitization(displayInsight) ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">OBSERVATION</h4>
                        <p className="text-base">Not enough activity was logged this week to detect a clear pattern.</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">DIAGNOSIS</h4>
                        <p className="text-base">This usually means tasks are not being completed or outcomes aren't being tracked consistently.</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">RECOMMENDATION</h4>
                        <p className="text-base font-medium text-primary">Pick one daily task and track it for 7 days to unlock meaningful insights.</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">EXPECTED RESULT</h4>
                        <p className="text-base">After consistent tracking, patterns will emerge that help improve behavior outcomes.</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">NEXT CHECK</h4>
                        <p className="text-base">Review completed tasks and approvals in 7 days.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">OBSERVATION</h4>
                        <p className="text-base">{sanitizeInsightText(displayInsight.observation, children, displayInsight.child_id)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">DIAGNOSIS</h4>
                        <p className="text-base">{sanitizeInsightText(displayInsight.diagnosis, children, displayInsight.child_id)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">RECOMMENDATION</h4>
                        <p className="text-base font-medium text-primary">{sanitizeInsightText(displayInsight.recommendation, children, displayInsight.child_id)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">EXPECTED RESULT</h4>
                        <p className="text-base">{sanitizeInsightText(displayInsight.expected_result, children, displayInsight.child_id)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">NEXT CHECK</h4>
                        <p className="text-base">{sanitizeInsightText(displayInsight.next_check, children, displayInsight.child_id)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-400 mb-4 block">psychology</span>
                  <h3 className="text-xl font-bold mb-2">No insights yet</h3>
                  <p className="text-text-sub-light dark:text-text-sub-dark mb-6">
                    Once tasks and outcomes are logged, your coach will start generating weekly insights.
                  </p>
                  <button
                    onClick={scrollToAdvanced}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Run a manual analysis
                  </button>
                </div>
              )}
            </section>

            {/* C) Insight History Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">History</h2>
              {insightHistory.length > 0 ? (
                <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-4">
                    {insightHistory.map((insight) => (
                      <div key={insight.id} className="border-l-4 border-primary/50 pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-text-sub-light dark:text-text-sub-dark rounded text-xs font-bold uppercase">
                                {insight.created_by === 'system' ? 'Auto' : 'Manual'}
                              </span>
                              <span className="text-sm text-text-sub-light dark:text-text-sub-dark">
                                Week of {new Date(insight.week_start).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg">{sanitizeInsightText(insight.title, children, insight.child_id)}</h3>
                          </div>
                          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-bold">
                            {insight.impact_score}/100
                          </div>
                        </div>
                        <p className="text-sm text-text-sub-light dark:text-text-sub-dark line-clamp-2">
                          {sanitizeInsightText(insight.recommendation, children, insight.child_id)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
            <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-3 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-text-sub-light dark:text-text-sub-dark mt-4 text-sm">
                    Weekly insights will appear here.
                  </p>
                </div>
              )}
            </section>

            {/* D) Advanced Manual Analysis - Collapsed by default */}
            <section ref={advancedSectionRef}>
              <details className="group bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 open:shadow-md transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-sub-light dark:text-text-sub-dark">science</span>
                    <h2 className="text-xl font-bold">Advanced: Run a manual analysis</h2>
                  </div>
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-text-sub-light dark:text-text-sub-dark">expand_more</span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-4">
                    Generate a custom analysis for a specific child or outcome. This creates a manual insight that won't overwrite your automatic weekly insights.
                  </p>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Child (optional)</label>
                  <select
                    value={selectedChildId || ''}
                    onChange={(e) => setSelectedChildId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">All Children</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Outcome (optional)</label>
                  <select
                    value={selectedOutcomeId || ''}
                    onChange={(e) => setSelectedOutcomeId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">All Outcomes</option>
                    {outcomes.map((outcome) => (
                      <option key={outcome.id} value={outcome.id}>
                        {outcome.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateCoaching}
                    disabled={generating}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                        {generating ? 'Generating...' : 'Generate Explanation'}
                  </button>
                    </div>
                  </div>

                  {manualInsights && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs font-bold uppercase">
                          Manual
                        </span>
                        <h3 className="font-bold">Generated Analysis</h3>
                    </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">OBSERVATION</h4>
                          <p className="text-sm">{needsSanitization(manualInsights) ? 'Not enough activity was logged this week to detect a clear pattern.' : sanitizeInsightText(manualInsights.observation, children, selectedChildId)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-text-sub-light dark:text-text-sub-dark mb-1">RECOMMENDATION</h4>
                          <p className="text-sm font-medium text-primary">{needsSanitization(manualInsights) ? 'Pick one daily task and track it for 7 days to unlock meaningful insights.' : sanitizeInsightText(manualInsights.recommendation, children, selectedChildId)}</p>
                        </div>
                      </div>
                  </div>
                )}
                </div>
              </details>
            </section>
            </div>
          </main>
        </div>
      </PremiumGate>
    </ChildModeGuard>
  );
}
