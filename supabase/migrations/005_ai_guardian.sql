-- ============================================
-- AI Guardian: Proactive Signals & Insights
-- ============================================

-- 1) AI_FAMILY_INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_family_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.ai_family_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights in their family" ON public.ai_family_insights
  FOR SELECT USING (family_id = public.get_user_family_id());

CREATE POLICY "Parents can update insights" ON public.ai_family_insights
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_family_insights_family_id ON public.ai_family_insights(family_id);
CREATE INDEX IF NOT EXISTS idx_ai_family_insights_dismissed ON public.ai_family_insights(family_id, dismissed_at) WHERE dismissed_at IS NULL;

-- 2) DETECT_FAMILY_SIGNALS RPC
-- Analyzes family data for the Proactive AI Guardian
CREATE OR REPLACE FUNCTION public.detect_family_signals(
  p_family_id uuid,
  p_lookback_days int DEFAULT 7
)
RETURNS TABLE (
  signal_type text,
  severity text,
  explanation text,
  recommended_action text,
  child_id uuid,
  child_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date timestamptz;
  v_prev_start_date timestamptz;
BEGIN
  v_start_date := now() - (p_lookback_days || ' days')::interval;
  v_prev_start_date := v_start_date - (p_lookback_days || ' days')::interval;

  -- Signal 1: Approval Latency Spike (parent approvals slowing down)
  RETURN QUERY
  WITH latency_data AS (
    SELECT 
      te_approved.family_id,
      te_approved.child_id,
      EXTRACT(EPOCH FROM (te_approved.created_at - te_completed.created_at)) / 60 as latency_mins,
      te_approved.created_at
    FROM public.task_events te_approved
    JOIN public.task_events te_completed ON (
      te_completed.assigned_task_id = te_approved.assigned_task_id
      AND te_completed.event_type = 'completed'
      AND te_completed.created_at < te_approved.created_at
    )
    WHERE te_approved.family_id = p_family_id
      AND te_approved.event_type = 'approved'
      AND te_approved.created_at >= v_prev_start_date
  ),
  weekly_latency AS (
    SELECT 
      wl_data.child_id,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_mins) FILTER (WHERE created_at >= v_start_date) as current_median,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_mins) FILTER (WHERE created_at < v_start_date) as prev_median
    FROM latency_data wl_data
    GROUP BY wl_data.child_id
  )
  SELECT 
    'approval_latency_spike'::text,
    'medium'::text,
    'Approval latency for ' || c.name || ' has increased by ' || ROUND(COALESCE(current_median, 0) - COALESCE(prev_median, 0)) || ' minutes this week.'::text,
    'Fast rewards boost motivation—try to approve completed tasks within an hour.'::text,
    wl.child_id,
    c.name
  FROM weekly_latency wl
  JOIN public.children c ON c.id = wl.child_id
  WHERE current_median > prev_median + 30; -- Spike of 30+ minutes

  -- Signal 2: Evening Slump (completion drops after 6pm)
  RETURN QUERY
  WITH completion_time AS (
    SELECT 
      ct_data.child_id,
      EXTRACT(HOUR FROM ct_data.created_at) as hour,
      COUNT(*) as count
    FROM public.task_events ct_data
    WHERE ct_data.family_id = p_family_id
      AND ct_data.event_type = 'completed'
      AND ct_data.created_at >= v_start_date
    GROUP BY ct_data.child_id, hour
  ),
  slub_data AS (
    SELECT 
      sd_data.child_id,
      SUM(CASE WHEN hour >= 18 THEN count ELSE 0 END) as evening_count,
      SUM(CASE WHEN hour < 18 THEN count ELSE 0 END) as daytime_count
    FROM completion_time sd_data
    GROUP BY sd_data.child_id
  )
  SELECT 
    'evening_slump'::text,
    'medium'::text,
    'Task completion for ' || c.name || ' drops significantly after 6pm.'::text,
    'Try moving critical tasks earlier or simplifying the evening routine.'::text,
    sd.child_id,
    c.name
  FROM slub_data sd
  JOIN public.children c ON c.id = sd.child_id
  WHERE daytime_count > 0 AND (evening_count::numeric / daytime_count) < 0.3;

  -- Signal 3: Trust Drift (completion rate down 20%+ over 7 days)
  RETURN QUERY
  WITH weekly_stats AS (
    SELECT 
      ws_data.child_id,
      COUNT(*) FILTER (WHERE event_type = 'completed' AND created_at >= v_start_date)::numeric / NULLIF(COUNT(*) FILTER (WHERE event_type IN ('completed', 'assigned') AND created_at >= v_start_date), 0) * 100 as current_rate,
      COUNT(*) FILTER (WHERE event_type = 'completed' AND created_at >= v_prev_start_date AND created_at < v_start_date)::numeric / NULLIF(COUNT(*) FILTER (WHERE event_type IN ('completed', 'assigned') AND created_at >= v_prev_start_date AND created_at < v_start_date), 0) * 100 as prev_rate
    FROM public.task_events ws_data
    WHERE ws_data.family_id = p_family_id
      AND ws_data.created_at >= v_prev_start_date
    GROUP BY ws_data.child_id
  )
  SELECT 
    'trust_drift'::text,
    'high'::text,
    'Completion rate for ' || c.name || ' is down ' || ROUND(COALESCE(prev_rate, 0) - COALESCE(current_rate, 0)) || '% compared to last week.'::text,
    'Ask if something is getting in the way or if rewards need more variety.'::text,
    ws.child_id,
    c.name
  FROM weekly_stats ws
  JOIN public.children c ON c.id = ws.child_id
  WHERE prev_rate - current_rate >= 20;

  -- Signal 4: Parent Overcontrol (high rejection rate)
  RETURN QUERY
  WITH rejection_stats AS (
    SELECT 
      rs_data.child_id,
      COUNT(*) FILTER (WHERE event_type = 'rejected')::numeric / NULLIF(COUNT(*) FILTER (WHERE event_type IN ('approved', 'rejected')), 0) * 100 as rejection_rate
    FROM public.task_events rs_data
    WHERE rs_data.family_id = p_family_id
      AND rs_data.created_at >= v_start_date
    GROUP BY rs_data.child_id
  )
  SELECT 
    'parent_overcontrol'::text,
    'medium'::text,
    'You rejected ' || ROUND(rejection_rate) || '% of submissions this week.'::text,
    'Try using the "Discuss" option for minor issues instead of a full rejection.'::text,
    rs.child_id,
    c.name
  FROM rejection_stats rs
  JOIN public.children c ON c.id = rs.child_id
  WHERE rejection_rate > 30;

END;
$$;
