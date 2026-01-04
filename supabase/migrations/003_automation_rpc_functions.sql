-- ============================================
-- Automation & Reporting RPC Functions
-- Auto-approval, weekly reports, coaching signal generation
-- ============================================

-- 1) APPLY_AUTO_APPROVAL
-- Automatically approve tasks based on policies (idempotent, row-level locking)
CREATE OR REPLACE FUNCTION public.apply_auto_approval(
  p_parent_id uuid DEFAULT NULL -- NULL = current user
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
  v_user_id uuid;
  v_approved_count int := 0;
  v_task_record record;
  v_policy_record record;
  v_completion_rate numeric;
  v_task_count int;
BEGIN
  -- Authorization
  v_user_id := COALESCE(p_parent_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'parent') THEN
    RAISE EXCEPTION 'Access denied. Only parents can apply auto-approval.';
  END IF;

  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_user_id;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Parent profile not found.';
  END IF;

  -- Get tasks ready for review
  FOR v_task_record IN
    SELECT at.*
    FROM public.assigned_tasks at
    WHERE at.family_id = v_family_id
      AND at.status = 'ready_for_review'
      AND at.requires_approval = true
    FOR UPDATE -- Row-level lock
  LOOP
    -- Check if any policy applies
    FOR v_policy_record IN
      SELECT *
      FROM public.auto_approval_policies
      WHERE family_id = v_family_id
        AND active = true
        AND (
          (child_id IS NULL OR child_id = v_task_record.child_id)
          AND (
            task_template_id IS NULL 
            OR task_template_id = v_task_record.template_id
            OR (
              task_template_id IN (
                SELECT outcome_id FROM public.outcome_tasks 
                WHERE assigned_task_id = v_task_record.id
              )
            )
          )
        )
      ORDER BY 
        CASE policy_type
          WHEN 'recurring_high_reliability' THEN 1
          WHEN 'low_risk_task' THEN 2
          ELSE 3
        END
      LIMIT 1
    LOOP
      -- Check policy type
      IF v_policy_record.policy_type = 'recurring_high_reliability' THEN
        -- Check completion rate for this task template
        IF v_task_record.template_id IS NOT NULL THEN
          SELECT 
            COUNT(*) FILTER (WHERE status IN ('approved', 'ready_for_review'))::numeric / 
            NULLIF(COUNT(*), 0) * 100,
            COUNT(*)
          INTO v_completion_rate, v_task_count
          FROM public.assigned_tasks
          WHERE template_id = v_task_record.template_id
            AND child_id = v_task_record.child_id
            AND created_at >= (CURRENT_DATE - (v_policy_record.lookback_days || ' days')::interval);

          IF v_completion_rate >= v_policy_record.min_completion_rate AND v_task_count >= 5 THEN
            -- Auto-approve
            PERFORM public.approve_task(v_task_record.id);
            v_approved_count := v_approved_count + 1;
            EXIT; -- Move to next task
          END IF;
        END IF;
      ELSIF v_policy_record.policy_type = 'low_risk_task' THEN
        -- Auto-approve low risk tasks
        PERFORM public.approve_task(v_task_record.id);
        v_approved_count := v_approved_count + 1;
        EXIT; -- Move to next task
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'approved_count', v_approved_count
  );
END;
$$;

-- 2) GENERATE_WEEKLY_REPORT
-- Generate weekly report with before/after metrics and recommendations
CREATE OR REPLACE FUNCTION public.generate_weekly_report(
  p_family_id uuid DEFAULT NULL, -- NULL = current user's family
  p_week_start date DEFAULT (CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::int || ' days')::interval)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_family_id uuid;
  v_week_end date;
  v_prev_week_start date;
  v_prev_week_end date;
  v_children jsonb;
  v_child_record record;
  v_outcomes jsonb;
  v_wins jsonb;
  v_challenges jsonb;
  v_consistency_score numeric;
BEGIN
  -- Authorization
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF p_family_id IS NULL THEN
    SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_user_id;
  ELSE
    v_family_id := p_family_id;
    -- Verify access
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = v_user_id AND family_id = v_family_id
    ) THEN
      RAISE EXCEPTION 'Access denied.';
    END IF;
  END IF;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Family not found.';
  END IF;

  -- Calculate date ranges
  v_week_end := p_week_start + INTERVAL '6 days';
  v_prev_week_start := p_week_start - INTERVAL '7 days';
  v_prev_week_end := p_week_start - INTERVAL '1 day';

  -- Build children array with metrics
  v_children := '[]'::jsonb;

  FOR v_child_record IN
    SELECT id, name
    FROM public.children
    WHERE family_id = v_family_id AND deleted_at IS NULL
  LOOP
    -- Get current week metrics
    SELECT jsonb_agg(outcome) INTO v_outcomes
    FROM (
      SELECT outcome
      FROM jsonb_array_elements(
        public.compute_outcome_metrics(
          v_child_record.id,
          NULL,
          p_week_start,
          v_week_end
        )->'outcomes'
      ) AS outcome
    ) AS outcomes;

    -- Get previous week metrics for comparison
    -- (simplified - in production, compute both and compare)

    v_children := v_children || jsonb_build_object(
      'child_id', v_child_record.id,
      'child_name', v_child_record.name,
      'outcomes', COALESCE(v_outcomes, '[]'::jsonb)
    );
  END LOOP;

  -- Calculate consistency score (weighted composite)
  -- Simplified: average of completion rates across all outcomes
  SELECT COALESCE(AVG(completion_rate), 0) INTO v_consistency_score
  FROM (
    SELECT (outcome->>'completion_rate')::numeric as completion_rate
    FROM jsonb_array_elements(v_children) AS child,
         jsonb_array_elements(child->'outcomes') AS outcome
  ) AS rates;

  -- Identify wins and challenges (simplified - in production, compare with previous week)
  v_wins := '[]'::jsonb;
  v_challenges := '[]'::jsonb;

  RETURN jsonb_build_object(
    'family_id', v_family_id,
    'week_start', p_week_start,
    'week_end', v_week_end,
    'children', v_children,
    'consistency_score', v_consistency_score,
    'wins', v_wins,
    'challenges', v_challenges,
    'generated_at', now()
  );
END;
$$;

-- 3) GENERATE_COACHING_SIGNALS
-- Deterministic signal generation (runs before AI coaching)
CREATE OR REPLACE FUNCTION public.generate_coaching_signals(
  p_child_id uuid DEFAULT NULL, -- NULL = family-level
  p_outcome_id uuid DEFAULT NULL, -- NULL = all outcomes
  p_lookback_days int DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_family_id uuid;
  v_user_id uuid;
  v_signals jsonb;
  v_start_date date;
  v_evening_completion_rate numeric;
  v_baseline_completion_rate numeric;
  v_approval_latency numeric;
  v_assigned_tasks_count int;
  v_historical_median int;
  v_weekend_completion_rate numeric;
  v_weekday_completion_rate numeric;
BEGIN
  -- Authorization
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_user_id;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  IF p_child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.children 
      WHERE id = p_child_id AND family_id = v_family_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Child not found or access denied.';
    END IF;
  END IF;

  v_start_date := CURRENT_DATE - (p_lookback_days || ' days')::interval;
  v_signals := '{}'::jsonb;

  -- Signal 1: Evening slump (completion rate after 7pm is 25% lower than baseline)
  IF p_child_id IS NOT NULL THEN
    SELECT 
      COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM created_at) >= 19 AND event_type = 'completed')::numeric /
      NULLIF(COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM created_at) >= 19), 0) * 100,
      COUNT(*) FILTER (WHERE event_type = 'completed')::numeric /
      NULLIF(COUNT(*), 0) * 100
    INTO v_evening_completion_rate, v_baseline_completion_rate
    FROM public.task_events
    WHERE child_id = p_child_id
      AND created_at >= v_start_date
      AND event_type IN ('completed', 'assigned');

    IF v_evening_completion_rate IS NOT NULL AND v_baseline_completion_rate IS NOT NULL 
       AND (v_baseline_completion_rate - v_evening_completion_rate) >= 25 THEN
      v_signals := v_signals || jsonb_build_object('evening_slump', true);
    END IF;

    -- Signal 2: Approval drag (approval latency > 60 minutes)
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
      EXTRACT(EPOCH FROM (te_approved.created_at - te_completed.created_at)) / 60
    )
    INTO v_approval_latency
    FROM public.task_events te_approved
    JOIN public.task_events te_completed ON (
      te_completed.assigned_task_id = te_approved.assigned_task_id
      AND te_completed.event_type = 'completed'
      AND te_completed.created_at < te_approved.created_at
    )
    WHERE te_approved.child_id = p_child_id
      AND te_approved.event_type = 'approved'
      AND te_approved.created_at >= v_start_date;

    IF v_approval_latency IS NOT NULL AND v_approval_latency > 60 THEN
      v_signals := v_signals || jsonb_build_object('approval_drag', v_approval_latency);
    END IF;

    -- Signal 3: Overload (assigned tasks/day > historical median + 30%)
    SELECT 
      COUNT(*) / p_lookback_days::numeric,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY daily_count)
    INTO v_assigned_tasks_count, v_historical_median
    FROM (
      SELECT DATE(created_at) as day, COUNT(*) as daily_count
      FROM public.assigned_tasks
      WHERE child_id = p_child_id
        AND created_at >= v_start_date
      GROUP BY DATE(created_at)
    ) daily_counts,
    (
      SELECT COUNT(*) / NULLIF(EXTRACT(DAY FROM (CURRENT_DATE - (v_start_date - INTERVAL '30 days')))::numeric, 0) as historical_median
      FROM public.assigned_tasks
      WHERE child_id = p_child_id
        AND created_at >= (v_start_date - INTERVAL '30 days')
        AND created_at < v_start_date
    ) historical;

    IF v_assigned_tasks_count IS NOT NULL AND v_historical_median IS NOT NULL
       AND v_assigned_tasks_count > (v_historical_median * 1.3) THEN
      v_signals := v_signals || jsonb_build_object('overload', true);
    END IF;

    -- Signal 4: Weekend regression (Sat/Sun completion lower than weekdays by > 20%)
    SELECT 
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM created_at) IN (0,6) AND event_type = 'completed')::numeric /
      NULLIF(COUNT(*) FILTER (WHERE EXTRACT(DOW FROM created_at) IN (0,6)), 0) * 100,
      COUNT(*) FILTER (WHERE EXTRACT(DOW FROM created_at) NOT IN (0,6) AND event_type = 'completed')::numeric /
      NULLIF(COUNT(*) FILTER (WHERE EXTRACT(DOW FROM created_at) NOT IN (0,6)), 0) * 100
    INTO v_weekend_completion_rate, v_weekday_completion_rate
    FROM public.task_events
    WHERE child_id = p_child_id
      AND created_at >= v_start_date
      AND event_type IN ('completed', 'assigned');

    IF v_weekend_completion_rate IS NOT NULL AND v_weekday_completion_rate IS NOT NULL
       AND (v_weekday_completion_rate - v_weekend_completion_rate) > 20 THEN
      v_signals := v_signals || jsonb_build_object('weekend_regression', true);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'signals', v_signals,
    'generated_at', now(),
    'lookback_days', p_lookback_days
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.apply_auto_approval TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_weekly_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_coaching_signals TO authenticated;

