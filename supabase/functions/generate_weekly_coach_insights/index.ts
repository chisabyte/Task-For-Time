import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FamilyMetrics {
  tasks_assigned_count: number;
  tasks_completed_count: number;
  completion_rate: number;
  approval_latency_avg_minutes: number;
  approvals_count: number;
  evening_slump_score: number;
  missing_outcome_rate: number;
}

interface GeneratedInsight {
  title: string;
  observation: string;
  diagnosis: string;
  recommendation: string;
  expected_result: string;
  next_check: string;
  impact_score: number;
}

/**
 * Get start of week (Monday) for a given date
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Compute family weekly metrics
 */
async function computeFamilyMetrics(
  supabase: any,
  familyId: string,
  weekStart: string
): Promise<FamilyMetrics> {
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const weekStartISO = weekStartDate.toISOString();
  const weekEndISO = weekEndDate.toISOString();

  // Get assigned tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('assigned_tasks')
    .select('id, child_id, status, created_at')
    .eq('family_id', familyId)
    .gte('created_at', weekStartISO)
    .lt('created_at', weekEndISO);

  if (tasksError) {
    console.error(`[coach-insights] Error fetching tasks for family ${familyId}:`, tasksError);
    throw tasksError;
  }

  const taskList = tasks || [];
  const tasksAssignedCount = taskList.length;
  const tasksCompletedCount = taskList.filter((t: any) => t.status === 'approved').length;
  const completionRate = tasksAssignedCount > 0 ? tasksCompletedCount / tasksAssignedCount : 0;

  // Get task events for approval latency
  const { data: events, error: eventsError } = await supabase
    .from('task_events')
    .select('assigned_task_id, event_type, created_at')
    .eq('family_id', familyId)
    .in('event_type', ['completed', 'approved'])
    .gte('created_at', weekStartISO)
    .lt('created_at', weekEndISO)
    .order('created_at', { ascending: true });

  if (eventsError) {
    console.error(`[coach-insights] Error fetching events for family ${familyId}:`, eventsError);
  }

  const eventList = events || [];
  const taskEventMap = new Map<string, { completed?: Date; approved?: Date }>();
  for (const event of eventList) {
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

  let approvalLatencyTotal = 0;
  let approvalLatencyCount = 0;
  for (const [_, events] of taskEventMap) {
    if (events.completed && events.approved) {
      const latency = (events.approved.getTime() - events.completed.getTime()) / (1000 * 60);
      if (latency > 0) {
        approvalLatencyTotal += latency;
        approvalLatencyCount++;
      }
    }
  }

  const approvalLatencyAvgMinutes = approvalLatencyCount > 0 ? approvalLatencyTotal / approvalLatencyCount : 0;
  const approvalsCount = eventList.filter((e: any) => e.event_type === 'approved').length;

  // Evening slump
  const eveningHour = 17;
  const morningTasks = taskList.filter((t: any) => {
    const hour = new Date(t.created_at).getHours();
    return hour < eveningHour;
  });
  const eveningTasks = taskList.filter((t: any) => {
    const hour = new Date(t.created_at).getHours();
    return hour >= eveningHour;
  });

  const morningCompletionRate = morningTasks.length > 0
    ? morningTasks.filter((t: any) => t.status === 'approved').length / morningTasks.length
    : 0;
  const eveningCompletionRate = eveningTasks.length > 0
    ? eveningTasks.filter((t: any) => t.status === 'approved').length / eveningTasks.length
    : 0;

  const eveningSlumpScore = morningTasks.length > 0 && eveningTasks.length > 0
    ? Math.max(0, Math.min(100, (morningCompletionRate - eveningCompletionRate) * 100))
    : 0;

  // Missing outcome rate
  const { data: outcomes } = await supabase
    .from('outcomes')
    .select('id')
    .eq('family_id', familyId)
    .eq('active', true)
    .limit(1);

  let missingOutcomeRate = 0;
  if (outcomes && outcomes.length > 0 && taskList.length > 0) {
    const { data: outcomeTasks } = await supabase
      .from('outcome_tasks')
      .select('assigned_task_id')
      .in('assigned_task_id', taskList.map((t: any) => t.id))
      .limit(taskList.length);

    if (outcomeTasks) {
      const linkedTaskIds = new Set(outcomeTasks.map((ot: any) => ot.assigned_task_id).filter(Boolean));
      const unlinkedCount = taskList.filter((t: any) => !linkedTaskIds.has(t.id)).length;
      missingOutcomeRate = tasksAssignedCount > 0 ? unlinkedCount / tasksAssignedCount : 0;
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
  };
}

/**
 * Generate insight from metrics (rule-based)
 */
function generateInsight(metrics: FamilyMetrics): GeneratedInsight {
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

  if (metrics.approval_latency_avg_minutes > 60 && metrics.approvals_count > 0) {
    const hours = Math.round(metrics.approval_latency_avg_minutes / 60 * 10) / 10;
    return {
      title: 'Speed Up Task Approvals',
      observation: `Tasks are taking an average of ${hours} hours to get approved. Research shows faster feedback loops boost motivation.`,
      diagnosis: 'Delayed approvals can reduce children's motivation and break the connection between effort and reward.',
      recommendation: 'Set aside 5-10 minutes twice daily for quick approvals. Consider auto-approval rules for high-reliability tasks your children complete consistently.',
      expected_result: 'Children feel more immediate recognition for their efforts, which can increase task completion and engagement.',
      next_check: 'Average approval time in hours',
      impact_score: Math.min(100, Math.round(metrics.approval_latency_avg_minutes / 10)),
    };
  }

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

  return {
    title: 'Keep Up the Great Work',
    observation: `Your family completed ${Math.round(metrics.completion_rate * 100)}% of tasks this week with ${metrics.tasks_completed_count} tasks finished.`,
    diagnosis: 'Your current approach is working well. Consistency and positive reinforcement are key to maintaining progress.',
    recommendation: 'Continue your current routines. Consider adding new challenges gradually, and keep celebrating the wins along the way.',
    expected_result: 'Sustained progress and continued engagement as children build positive habits.',
    next_check: 'Weekly completion rate and total tasks completed',
    impact_score: Math.round(metrics.completion_rate * 50),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current week start (Monday)
    const today = new Date();
    const weekStart = getWeekStart(today);

    console.log(`[coach-insights] Generating insights for week starting ${weekStart}`);

    // Fetch all families
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id');

    if (familiesError) {
      console.error('[coach-insights] Error fetching families:', familiesError);
      throw familiesError;
    }

    const results = [];

    for (const family of families || []) {
      try {
        // Check if insight already exists for this week
        const { data: existingInsight } = await supabase
          .from('coach_insights')
          .select('id')
          .eq('family_id', family.id)
          .eq('scope', 'family')
          .eq('week_start', weekStart)
          .eq('created_by', 'system')
          .limit(1)
          .single();

        if (existingInsight) {
          console.log(`[coach-insights] Insight already exists for family ${family.id}, week ${weekStart}`);
          continue;
        }

        // Compute metrics
        const metrics = await computeFamilyMetrics(supabase, family.id, weekStart);

        // Skip if no tasks assigned (not enough data)
        if (metrics.tasks_assigned_count === 0) {
          console.log(`[coach-insights] No tasks assigned for family ${family.id}, skipping`);
          continue;
        }

        // Generate insight
        const insight = generateInsight(metrics);

        // Insert insight
        const { error: insertError } = await supabase
          .from('coach_insights')
          .insert({
            family_id: family.id,
            scope: 'family',
            child_id: null,
            week_start: weekStart,
            outcome_filter: null,
            title: insight.title,
            observation: insight.observation,
            diagnosis: insight.diagnosis,
            recommendation: insight.recommendation,
            expected_result: insight.expected_result,
            next_check: insight.next_check,
            impact_score: insight.impact_score,
            created_by: 'system',
            source_metrics: metrics as any,
          });

        if (insertError) {
          console.error(`[coach-insights] Error inserting insight for family ${family.id}:`, insertError);
          continue;
        }

        console.log(`[coach-insights] Generated insight for family ${family.id}`);
        results.push({ family_id: family.id, success: true });
      } catch (error) {
        console.error(`[coach-insights] Error processing family ${family.id}:`, error);
        results.push({ family_id: family.id, success: false, error: String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStart,
        families_processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[coach-insights] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

