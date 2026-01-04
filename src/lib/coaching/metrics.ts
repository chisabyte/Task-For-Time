/**
 * Server-only metrics computation for coach insights
 * This module computes family weekly metrics from database tables
 * IMPORTANT: This module should only be imported server-side (Edge Functions, API routes)
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export interface FamilyMetrics {
  tasks_assigned_count: number;
  tasks_completed_count: number;
  completion_rate: number; // 0-1
  approval_latency_avg_minutes: number;
  approvals_count: number;
  evening_slump_score: number; // 0-100
  missing_outcome_rate: number; // 0-1
  top_contributing_child_id?: string;
}

/**
 * Get family weekly metrics for coach insights
 * @param familyId - Family UUID
 * @param weekStart - Start date of the week (YYYY-MM-DD)
 * @param client - Optional Supabase client (for service role or user auth)
 */
export async function getFamilyWeeklyMetrics(
  familyId: string,
  weekStart: string,
  client?: SupabaseClient
): Promise<FamilyMetrics> {
  const supabase = client || createClient<Database>(supabaseUrl, supabaseServiceKey);

  // Parse week start and calculate week end
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const weekStartISO = weekStartDate.toISOString();
  const weekEndISO = weekEndDate.toISOString();

  // 1. Get all assigned tasks in this week
  const { data: assignedTasks, error: tasksError } = await supabase
    .from('assigned_tasks')
    .select('id, child_id, status, created_at')
    .eq('family_id', familyId)
    .gte('created_at', weekStartISO)
    .lt('created_at', weekEndISO);

  if (tasksError) {
    console.error('[coaching/metrics] Error fetching assigned tasks:', tasksError);
    throw new Error(`Failed to fetch assigned tasks: ${tasksError.message}`);
  }

  const tasks = assignedTasks || [];
  const tasksAssignedCount = tasks.length;
  const tasksCompletedCount = tasks.filter(t => t.status === 'approved').length;
  const completionRate = tasksAssignedCount > 0 ? tasksCompletedCount / tasksAssignedCount : 0;

  // 2. Get approval latency from task_events
  // Find completed -> approved event pairs for tasks in this week
  const { data: taskEvents, error: eventsError } = await supabase
    .from('task_events')
    .select('assigned_task_id, event_type, created_at')
    .eq('family_id', familyId)
    .in('event_type', ['completed', 'approved'])
    .gte('created_at', weekStartISO)
    .lt('created_at', weekEndISO)
    .order('created_at', { ascending: true });

  if (eventsError) {
    console.error('[coaching/metrics] Error fetching task events:', eventsError);
    // Non-fatal: continue without approval latency
  }

  let approvalLatencyTotal = 0;
  let approvalLatencyCount = 0;
  const events = taskEvents || [];

  // Group events by assigned_task_id and calculate latency
  const taskEventMap = new Map<string, { completed?: Date; approved?: Date }>();
  for (const event of events) {
    if (!event.assigned_task_id) continue;
    if (!taskEventMap.has(event.assigned_task_id)) {
      taskEventMap.set(event.assigned_task_id, {});
    }
    const taskEvents = taskEventMap.get(event.assigned_task_id)!;
    const eventDate = new Date(event.created_at);
    if (event.event_type === 'completed') {
      taskEvents.completed = eventDate;
    } else if (event.event_type === 'approved') {
      taskEvents.approved = eventDate;
    }
  }

  // Calculate average latency
  for (const [_, events] of taskEventMap) {
    if (events.completed && events.approved) {
      const latency = (events.approved.getTime() - events.completed.getTime()) / (1000 * 60); // minutes
      if (latency > 0) {
        approvalLatencyTotal += latency;
        approvalLatencyCount++;
      }
    }
  }

  const approvalLatencyAvgMinutes = approvalLatencyCount > 0 ? approvalLatencyTotal / approvalLatencyCount : 0;
  const approvalsCount = events.filter(e => e.event_type === 'approved').length;

  // 3. Calculate evening slump score (completion rate drop after 5pm)
  const eveningHour = 17; // 5pm
  const morningTasks = tasks.filter(t => {
    const hour = new Date(t.created_at).getHours();
    return hour < eveningHour;
  });
  const eveningTasks = tasks.filter(t => {
    const hour = new Date(t.created_at).getHours();
    return hour >= eveningHour;
  });

  const morningCompletionRate = morningTasks.length > 0
    ? morningTasks.filter(t => t.status === 'approved').length / morningTasks.length
    : 0;
  const eveningCompletionRate = eveningTasks.length > 0
    ? eveningTasks.filter(t => t.status === 'approved').length / eveningTasks.length
    : 0;

  const eveningSlumpScore = morningTasks.length > 0 && eveningTasks.length > 0
    ? Math.max(0, Math.min(100, (morningCompletionRate - eveningCompletionRate) * 100))
    : 0;

  // 4. Missing outcome rate (tasks not linked to outcomes)
  // Check if outcomes table exists and has data
  const { data: outcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .select('id')
    .eq('family_id', familyId)
    .eq('active', true)
    .limit(1);

  let missingOutcomeRate = 0;
  if (!outcomesError && outcomes && outcomes.length > 0) {
    // If outcomes exist, check outcome_tasks mapping
    const { data: outcomeTasks, error: outcomeTasksError } = await supabase
      .from('outcome_tasks')
      .select('assigned_task_id')
      .in('assigned_task_id', tasks.map(t => t.id))
      .limit(tasks.length);

    if (!outcomeTasksError) {
      const linkedTaskIds = new Set((outcomeTasks || []).map(ot => ot.assigned_task_id).filter(Boolean));
      const unlinkedCount = tasks.filter(t => !linkedTaskIds.has(t.id)).length;
      missingOutcomeRate = tasksAssignedCount > 0 ? unlinkedCount / tasksAssignedCount : 0;
    }
  } else {
    // No outcomes system or no active outcomes - can't calculate
    missingOutcomeRate = 0;
  }

  // 5. Top contributing child (by completion count)
  const childCompletionCounts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === 'approved' && task.child_id) {
      childCompletionCounts.set(task.child_id, (childCompletionCounts.get(task.child_id) || 0) + 1);
    }
  }

  let topContributingChildId: string | undefined;
  let maxCompletions = 0;
  for (const [childId, count] of childCompletionCounts) {
    if (count > maxCompletions) {
      maxCompletions = count;
      topContributingChildId = childId;
    }
  }

  return {
    tasks_assigned_count: tasksAssignedCount,
    tasks_completed_count: tasksCompletedCount,
    completion_rate: completionRate,
    approval_latency_avg_minutes: approvalLatencyAvgMinutes,
    approvals_count: approvalsCount,
    evening_slump_score: eveningSlumpScore,
    missing_outcome_rate: missingOutcomeRate,
    top_contributing_child_id: topContributingChildId,
  };
}

