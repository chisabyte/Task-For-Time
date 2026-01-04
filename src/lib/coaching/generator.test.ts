/**
 * Unit tests for insight generator
 * Run with: npm test or your test runner
 */

import { generateWeeklyInsight } from './generator';
import { FamilyMetrics } from './metrics';

describe('generateWeeklyInsight', () => {
  it('should prioritize missing outcome rate when high', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 15,
      completion_rate: 0.75,
      approval_latency_avg_minutes: 30,
      approvals_count: 15,
      evening_slump_score: 20,
      missing_outcome_rate: 0.5, // High
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.title).toContain('Tracking Clarity');
    expect(insight.recommendation).toContain('Link more tasks');
  });

  it('should prioritize approval latency when high', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 15,
      completion_rate: 0.75,
      approval_latency_avg_minutes: 120, // High (>60)
      approvals_count: 15,
      evening_slump_score: 20,
      missing_outcome_rate: 0.2, // Low
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.title).toContain('Speed Up');
    expect(insight.recommendation).toContain('approvals');
  });

  it('should prioritize evening slump when high', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 15,
      completion_rate: 0.75,
      approval_latency_avg_minutes: 30,
      approvals_count: 15,
      evening_slump_score: 50, // High (>30)
      missing_outcome_rate: 0.2,
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.title).toContain('Evening');
    expect(insight.recommendation).toContain('evening');
  });

  it('should provide positive reinforcement for good metrics', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 18,
      completion_rate: 0.9, // Good
      approval_latency_avg_minutes: 30,
      approvals_count: 18,
      evening_slump_score: 10,
      missing_outcome_rate: 0.1,
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.title).toContain('Great Work');
    expect(insight.recommendation).toContain('Continue');
  });

  it('should handle low completion rate', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 8,
      completion_rate: 0.4, // Low (<0.6)
      approval_latency_avg_minutes: 30,
      approvals_count: 8,
      evening_slump_score: 10,
      missing_outcome_rate: 0.2,
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.title).toContain('Momentum');
    expect(insight.recommendation).toContain('smaller');
  });

  it('should not expose child IDs in text', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 15,
      completion_rate: 0.75,
      approval_latency_avg_minutes: 30,
      approvals_count: 15,
      evening_slump_score: 20,
      missing_outcome_rate: 0.2,
      top_contributing_child_id: '550e8400-e29b-41d4-a716-446655440000', // UUID
    };

    const insight = generateWeeklyInsight(metrics);
    // Check that UUID patterns don't appear in any text fields
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    expect(insight.title).not.toMatch(uuidPattern);
    expect(insight.observation).not.toMatch(uuidPattern);
    expect(insight.diagnosis).not.toMatch(uuidPattern);
    expect(insight.recommendation).not.toMatch(uuidPattern);
    expect(insight.expected_result).not.toMatch(uuidPattern);
    expect(insight.next_check).not.toMatch(uuidPattern);
  });

  it('should always return valid impact score (0-100)', () => {
    const metrics: FamilyMetrics = {
      tasks_assigned_count: 20,
      tasks_completed_count: 15,
      completion_rate: 0.75,
      approval_latency_avg_minutes: 30,
      approvals_count: 15,
      evening_slump_score: 20,
      missing_outcome_rate: 0.2,
      top_contributing_child_id: undefined,
    };

    const insight = generateWeeklyInsight(metrics);
    expect(insight.impact_score).toBeGreaterThanOrEqual(0);
    expect(insight.impact_score).toBeLessThanOrEqual(100);
  });
});

