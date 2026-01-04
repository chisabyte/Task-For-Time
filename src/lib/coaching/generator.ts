/**
 * Server-only insight generator for coach insights
 * Rule-based generator that creates insights from metrics
 * IMPORTANT: This module should only be imported server-side
 */

import { FamilyMetrics } from './metrics';

export interface GeneratedInsight {
  title: string;
  observation: string;
  diagnosis: string;
  recommendation: string;
  expected_result: string;
  next_check: string;
  impact_score: number;
}

/**
 * Generate weekly insight from family metrics
 * Uses rule-based logic to create actionable insights
 */
export function generateWeeklyInsight(metrics: FamilyMetrics): GeneratedInsight {
  // Rule 1: High missing outcome rate -> tracking clarity insight
  if (metrics.missing_outcome_rate > 0.3) {
    return {
      title: 'Improve Task Tracking Clarity',
      observation: `${Math.round(metrics.missing_outcome_rate * 100)}% of tasks aren't linked to behavior outcomes. This makes it harder to track progress toward your family's goals.`,
      diagnosis: 'Tasks without outcome connections reduce visibility into which behaviors are improving over time.',
      recommendation: 'Link more tasks to specific outcomes. This helps you see patterns and measure progress toward your family goals.',
      expected_result: 'Better visibility into which behaviors are improving, making it easier to celebrate wins and identify areas needing support.',
      next_check: 'Percentage of tasks linked to outcomes',
      impact_score: Math.min(100, Math.round(metrics.missing_outcome_rate * 150)),
    };
  }

  // Rule 2: High approval latency -> fast approvals insight
  if (metrics.approval_latency_avg_minutes > 60 && metrics.approvals_count > 0) {
    const hours = Math.round(metrics.approval_latency_avg_minutes / 60 * 10) / 10;
    return {
      title: 'Speed Up Task Approvals',
      observation: `Tasks are taking an average of ${hours} hours to get approved. Research shows faster feedback loops boost motivation.`,
      diagnosis: "Delayed approvals can reduce children's motivation and break the connection between effort and reward.",
      recommendation: 'Set aside 5-10 minutes twice daily for quick approvals. Consider auto-approval rules for high-reliability tasks your children complete consistently.',
      expected_result: 'Children feel more immediate recognition for their efforts, which can increase task completion and engagement.',
      next_check: 'Average approval time in hours',
      impact_score: Math.min(100, Math.round(metrics.approval_latency_avg_minutes / 10)),
    };
  }

  // Rule 3: High evening slump -> evening routines insight
  if (metrics.evening_slump_score > 30) {
    return {
      title: 'Optimize Evening Task Schedule',
      observation: `Task completion drops significantly in the evening (${Math.round(metrics.evening_slump_score)}% lower than morning completion rate).`,
      diagnosis: 'Evening fatigue, competing activities, or natural energy dips can reduce task completion later in the day.',
      recommendation: 'Move critical or challenging tasks earlier in the day. Reserve evenings for lighter tasks or reduce evening task load altogether.',
      expected_result: 'Higher overall completion rates and reduced stress from trying to complete tasks during lower-energy times.',
      next_check: 'Evening vs morning completion rate difference',
      impact_score: Math.min(100, Math.round(metrics.evening_slump_score)),
    };
  }

  // Rule 4: Low completion rate -> positive reinforcement insight
  if (metrics.completion_rate < 0.6 && metrics.tasks_assigned_count > 0) {
    const completionPercent = Math.round(metrics.completion_rate * 100);
    return {
      title: 'Build Momentum with Smaller Wins',
      observation: `Your family is completing ${completionPercent}% of assigned tasks. Small, consistent improvements can create positive momentum.`,
      diagnosis: 'Lower completion rates can happen when tasks feel overwhelming, schedules are too packed, or motivation needs a boost.',
      recommendation: 'Start by breaking larger tasks into smaller steps, reducing daily task load temporarily, or adding more frequent positive reinforcement. Focus on consistency over volume.',
      expected_result: 'Gradual increase in completion rates as children build confidence and routines become more established.',
      next_check: 'Weekly completion rate percentage',
      impact_score: Math.min(100, Math.round((1 - metrics.completion_rate) * 100)),
    };
  }

  // Rule 5: Positive reinforcement (default for good metrics)
  return {
    title: 'Keep Up the Great Work',
    observation: `Your family completed ${Math.round(metrics.completion_rate * 100)}% of tasks this week with ${metrics.tasks_completed_count} tasks finished.`,
    diagnosis: 'Your current approach is working well. Consistency and positive reinforcement are key to maintaining progress.',
    recommendation: 'Continue your current routines. Consider adding new challenges gradually, and keep celebrating the wins along the way.',
    expected_result: 'Sustained progress and continued engagement as children build positive habits.',
    next_check: 'Weekly completion rate and total tasks completed',
    impact_score: Math.round(metrics.completion_rate * 50), // Lower impact for positive reinforcement
  };
}

