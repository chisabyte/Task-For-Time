"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CoachInsight {
  id: string;
  title: string;
  recommendation: string;
  impact_score: number;
  week_start: string;
  created_at: string;
}

interface CoachInsightCardProps {
  familyId: string;
}

/**
 * UUID regex pattern for matching UUIDs in text
 */
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}/gi;

/**
 * Sanitize text to remove UUIDs (simplified version for dashboard card)
 */
function sanitizeText(text: string): string {
  if (!text) return text;
  let sanitized = text;
  
  // Remove UUID patterns
  sanitized = sanitized.replace(UUID_REGEX, '');
  
  // Remove "child ID" patterns
  const childIdPattern = /child\s+ID\s*["']?[0-9a-fA-F-]{16,}["']?/gi;
  sanitized = sanitized.replace(childIdPattern, '');
  
  // Dev warning for remaining UUIDs
  if (process.env.NODE_ENV !== "production") {
    const remainingUuids = sanitized.match(UUID_REGEX);
    if (remainingUuids && remainingUuids.length > 0) {
      console.warn('[CoachInsightCard] UUID detected in sanitized text:', sanitized.substring(0, 100));
    }
  }
  
  return sanitized.trim();
}

export function CoachInsightCard({ familyId }: CoachInsightCardProps) {
  const router = useRouter();
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestInsight = async () => {
      try {
        // Get current week start (Monday)
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const currentWeekStart = monday.toISOString().split('T')[0];

        // Try to get current week's insight first
        const { data: currentWeekInsight } = await supabase
          .from('coach_insights')
          .select('id, title, recommendation, impact_score, week_start, created_at')
          .eq('family_id', familyId)
          .eq('scope', 'family')
          .eq('week_start', currentWeekStart)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (currentWeekInsight) {
          setInsight(currentWeekInsight);
          setLoading(false);
          return;
        }

        // If no current week insight, get the latest one
        const { data: latestInsight } = await supabase
          .from('coach_insights')
          .select('id, title, recommendation, impact_score, week_start, created_at')
          .eq('family_id', familyId)
          .eq('scope', 'family')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setInsight(latestInsight || null);
      } catch (error) {
        console.error('[CoachInsightCard] Error fetching insight:', error);
        setInsight(null);
      } finally {
        setLoading(false);
      }
    };

    if (familyId) {
      fetchLatestInsight();
    }
  }, [familyId]);

  if (loading) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            <h2 className="text-xl font-bold">Family Health Coach</h2>
          </div>
        </div>
        <p className="text-text-sub-light dark:text-text-sub-dark mb-4">
          Your coach will generate your first report after a week of usage.
        </p>
        <button
          onClick={() => router.push('/parent/coaching')}
          className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-1"
        >
          What does the coach measure?
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border-2 border-primary/30 dark:border-primary/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
          <h2 className="text-xl font-bold">Family Health Coach</h2>
        </div>
        <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold">
          Impact: {insight.impact_score}/100
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">{sanitizeText(insight.title)}</h3>
        <p className="text-base text-text-main-light dark:text-text-main-dark">
          {sanitizeText(insight.recommendation)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/parent/coaching')}
          className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => router.push('/parent/coaching')}
          className="px-4 py-2 bg-transparent text-text-sub-light dark:text-text-sub-dark font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          View History
        </button>
      </div>
    </div>
  );
}
