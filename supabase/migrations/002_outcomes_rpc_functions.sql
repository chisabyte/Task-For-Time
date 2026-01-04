-- ============================================
-- Outcomes System RPC Functions
-- Atomic, idempotent functions following existing patterns
-- ============================================

-- 1) UPSERT_OUTCOME
-- Create or update an outcome
CREATE OR REPLACE FUNCTION public.upsert_outcome(
  p_id uuid DEFAULT NULL,
  p_title text,
  p_description text DEFAULT NULL,
  p_template_type text DEFAULT NULL,
  p_success_criteria text DEFAULT NULL,
  p_weekly_target_days int DEFAULT 5,
  p_active boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
  v_parent_id uuid;
  v_outcome_id uuid;
  v_result jsonb;
BEGIN
  -- Authorization
  v_parent_id := auth.uid();
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_parent_id AND role = 'parent') THEN
    RAISE EXCEPTION 'Access denied. Only parents can manage outcomes.';
  END IF;

  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_parent_id;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Parent profile not found or has no family.';
  END IF;

  -- Validate template_type if provided
  IF p_template_type IS NOT NULL AND p_template_type NOT IN ('morning_routine', 'homework', 'bedtime', 'chores', 'kindness', 'custom') THEN
    RAISE EXCEPTION 'Invalid template_type.';
  END IF;

  -- Upsert
  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.outcomes
    SET 
      title = p_title,
      description = p_description,
      template_type = p_template_type,
      success_criteria = p_success_criteria,
      weekly_target_days = p_weekly_target_days,
      active = p_active,
      updated_at = now()
    WHERE id = p_id AND family_id = v_family_id
    RETURNING id INTO v_outcome_id;

    IF v_outcome_id IS NULL THEN
      RAISE EXCEPTION 'Outcome not found or access denied.';
    END IF;
  ELSE
    -- Insert new
    INSERT INTO public.outcomes (
      family_id, title, description, template_type, success_criteria, 
      weekly_target_days, active, created_by
    )
    VALUES (
      v_family_id, p_title, p_description, p_template_type, p_success_criteria,
      p_weekly_target_days, p_active, v_parent_id
    )
    RETURNING id INTO v_outcome_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'outcome_id', v_outcome_id
  );
END;
$$;

-- 2) MAP_TASK_TO_OUTCOME
-- Map an assigned task or template to an outcome
CREATE OR REPLACE FUNCTION public.map_task_to_outcome(
  p_outcome_id uuid,
  p_assigned_task_id uuid DEFAULT NULL,
  p_task_template_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
  v_parent_id uuid;
  v_outcome_family_id uuid;
  v_mapping_id uuid;
BEGIN
  -- Authorization
  v_parent_id := auth.uid();
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_parent_id AND role = 'parent') THEN
    RAISE EXCEPTION 'Access denied. Only parents can map tasks.';
  END IF;

  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_parent_id;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Parent profile not found.';
  END IF;

  -- Verify outcome belongs to family
  SELECT family_id INTO v_outcome_family_id FROM public.outcomes WHERE id = p_outcome_id;
  IF v_outcome_family_id IS NULL THEN
    RAISE EXCEPTION 'Outcome not found.';
  END IF;
  IF v_outcome_family_id != v_family_id THEN
    RAISE EXCEPTION 'Access denied. Outcome belongs to different family.';
  END IF;

  -- Validate at least one task reference
  IF p_assigned_task_id IS NULL AND p_task_template_id IS NULL THEN
    RAISE EXCEPTION 'Must provide either assigned_task_id or task_template_id.';
  END IF;

  -- Verify task belongs to family (if provided)
  IF p_assigned_task_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.assigned_tasks 
      WHERE id = p_assigned_task_id AND family_id = v_family_id
    ) THEN
      RAISE EXCEPTION 'Assigned task not found or access denied.';
    END IF;
  END IF;

  IF p_task_template_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.task_templates 
      WHERE id = p_task_template_id AND family_id = v_family_id
    ) THEN
      RAISE EXCEPTION 'Task template not found or access denied.';
    END IF;
  END IF;

  -- Check if mapping already exists (idempotency)
  SELECT id INTO v_mapping_id FROM public.outcome_tasks
  WHERE outcome_id = p_outcome_id
    AND (p_assigned_task_id IS NULL OR assigned_task_id = p_assigned_task_id)
    AND (p_task_template_id IS NULL OR task_template_id = p_task_template_id);

  IF v_mapping_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'mapping_id', v_mapping_id, 'idempotent', true);
  END IF;

  -- Insert mapping
  INSERT INTO public.outcome_tasks (outcome_id, assigned_task_id, task_template_id)
  VALUES (p_outcome_id, p_assigned_task_id, p_task_template_id)
  RETURNING id INTO v_mapping_id;

  RETURN jsonb_build_object('success', true, 'mapping_id', v_mapping_id, 'idempotent', false);
END;
$$;

-- 3) RECORD_TASK_EVENT
-- Record a task lifecycle event (idempotent via event_data.idempotency_key)
CREATE OR REPLACE FUNCTION public.record_task_event(
  p_child_id uuid,
  p_assigned_task_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
  v_user_id uuid;
  v_user_role text;
  v_task_family_id uuid;
  v_task_child_id uuid;
  v_event_id uuid;
  v_idempotency_key text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  -- Get user role and family
  SELECT role, family_id INTO v_user_role, v_family_id
  FROM public.profiles WHERE id = v_user_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  -- Verify task exists and belongs to family
  SELECT family_id, child_id INTO v_task_family_id, v_task_child_id
  FROM public.assigned_tasks WHERE id = p_assigned_task_id;

  IF v_task_family_id IS NULL THEN
    RAISE EXCEPTION 'Assigned task not found.';
  END IF;

  IF v_task_family_id != v_family_id THEN
    RAISE EXCEPTION 'Access denied. Task belongs to different family.';
  END IF;

  -- Verify child_id matches task's child_id (unless parent is recording)
  IF v_user_role = 'child' AND p_child_id != v_task_child_id THEN
    RAISE EXCEPTION 'Access denied. Child can only record events for their own tasks.';
  END IF;

  -- Verify child belongs to family
  IF NOT EXISTS (
    SELECT 1 FROM public.children 
    WHERE id = p_child_id AND family_id = v_family_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child not found or deleted.';
  END IF;

  -- Validate event_type
  IF p_event_type NOT IN ('assigned', 'completed', 'approved', 'rejected', 'redeemed', 'snoozed', 'nudged') THEN
    RAISE EXCEPTION 'Invalid event_type.';
  END IF;

  -- Idempotency check (if idempotency_key provided in event_data)
  IF p_event_data IS NOT NULL AND p_event_data ? 'idempotency_key' THEN
    v_idempotency_key := p_event_data->>'idempotency_key';
    SELECT id INTO v_event_id FROM public.task_events
    WHERE assigned_task_id = p_assigned_task_id
      AND event_type = p_event_type
      AND event_data->>'idempotency_key' = v_idempotency_key
    LIMIT 1;

    IF v_event_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'event_id', v_event_id, 'idempotent', true);
    END IF;
  END IF;

  -- Insert event
  INSERT INTO public.task_events (family_id, child_id, assigned_task_id, event_type, event_data)
  VALUES (v_family_id, p_child_id, p_assigned_task_id, p_event_type, p_event_data)
  RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('success', true, 'event_id', v_event_id, 'idempotent', false);
END;
$$;

-- 4) COMPUTE_OUTCOME_METRICS
-- Compute metrics for a child and outcome (or all outcomes) over a date range
CREATE OR REPLACE FUNCTION public.compute_outcome_metrics(
  p_child_id uuid,
  p_outcome_id uuid DEFAULT NULL, -- NULL = all outcomes
  p_start_date date DEFAULT (CURRENT_DATE - INTERVAL '14 days'),
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_family_id uuid;
  v_user_id uuid;
  v_result jsonb;
  v_outcomes jsonb;
  v_outcome_record record;
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

  -- Verify child belongs to family
  IF NOT EXISTS (
    SELECT 1 FROM public.children 
    WHERE id = p_child_id AND family_id = v_family_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Child not found or access denied.';
  END IF;

  -- Build outcomes list
  v_outcomes := '[]'::jsonb;

  FOR v_outcome_record IN
    SELECT o.id, o.title, o.weekly_target_days
    FROM public.outcomes o
    WHERE o.family_id = v_family_id
      AND o.active = true
      AND (p_outcome_id IS NULL OR o.id = p_outcome_id)
  LOOP
    -- Get tasks for this outcome
    WITH outcome_tasks AS (
      SELECT DISTINCT
        COALESCE(ot.assigned_task_id, at_from_template.id) as task_id
      FROM public.outcome_tasks ot
      LEFT JOIN public.assigned_tasks at_from_template ON (
        ot.task_template_id IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.assigned_tasks at2 
          WHERE at2.template_id = ot.task_template_id 
            AND at2.child_id = p_child_id
            AND at2.created_at::date BETWEEN p_start_date AND p_end_date
        )
      )
      WHERE ot.outcome_id = v_outcome_record.id
        AND (
          (ot.assigned_task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.assigned_tasks at3
            WHERE at3.id = ot.assigned_task_id
              AND at3.child_id = p_child_id
              AND at3.created_at::date BETWEEN p_start_date AND p_end_date
          ))
          OR ot.task_template_id IS NOT NULL
        )
    ),
    task_metrics AS (
      SELECT
        COUNT(DISTINCT at.id) FILTER (WHERE at.status IN ('approved', 'ready_for_review')) as completed_tasks,
        COUNT(DISTINCT at.id) as assigned_tasks,
        COUNT(DISTINCT at.id) FILTER (
          WHERE at.status IN ('approved', 'ready_for_review')
          AND EXISTS (
            SELECT 1 FROM public.task_events te
            WHERE te.assigned_task_id = at.id
              AND te.event_type = 'completed'
              AND te.created_at::date = at.created_at::date
          )
        ) as completed_on_time,
        -- Streak calculation (simplified: consecutive days with at least one completion)
        (
          SELECT COUNT(DISTINCT te.created_at::date)
          FROM public.task_events te
          JOIN public.outcome_tasks ot ON ot.assigned_task_id = te.assigned_task_id
          WHERE ot.outcome_id = v_outcome_record.id
            AND te.child_id = p_child_id
            AND te.event_type = 'completed'
            AND te.created_at::date BETWEEN p_start_date AND p_end_date
        ) as streak_days,
        -- Time to complete (median minutes from assigned to completed)
        (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
            EXTRACT(EPOCH FROM (te_completed.created_at - te_assigned.created_at)) / 60
          )
          FROM public.task_events te_completed
          JOIN public.task_events te_assigned ON (
            te_assigned.assigned_task_id = te_completed.assigned_task_id
            AND te_assigned.event_type = 'assigned'
            AND te_assigned.created_at < te_completed.created_at
          )
          JOIN public.outcome_tasks ot ON ot.assigned_task_id = te_completed.assigned_task_id
          WHERE ot.outcome_id = v_outcome_record.id
            AND te_completed.child_id = p_child_id
            AND te_completed.event_type = 'completed'
            AND te_completed.created_at::date BETWEEN p_start_date AND p_end_date
        ) as median_time_to_complete_minutes,
        -- Approval latency (median minutes from completed to approved)
        (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
            EXTRACT(EPOCH FROM (te_approved.created_at - te_completed.created_at)) / 60
          )
          FROM public.task_events te_approved
          JOIN public.task_events te_completed ON (
            te_completed.assigned_task_id = te_approved.assigned_task_id
            AND te_completed.event_type = 'completed'
            AND te_completed.created_at < te_approved.created_at
          )
          JOIN public.outcome_tasks ot ON ot.assigned_task_id = te_approved.assigned_task_id
          WHERE ot.outcome_id = v_outcome_record.id
            AND te_approved.child_id = p_child_id
            AND te_approved.event_type = 'approved'
            AND te_approved.created_at::date BETWEEN p_start_date AND p_end_date
        ) as median_approval_latency_minutes,
        -- Reminder/nudge count
        (
          SELECT COUNT(*)
          FROM public.task_events te
          JOIN public.outcome_tasks ot ON ot.assigned_task_id = te.assigned_task_id
          WHERE ot.outcome_id = v_outcome_record.id
            AND te.child_id = p_child_id
            AND te.event_type = 'nudged'
            AND te.created_at::date BETWEEN p_start_date AND p_end_date
        ) as reminder_count
      FROM public.assigned_tasks at
      JOIN outcome_tasks ot2 ON ot2.task_id = at.id
      WHERE at.child_id = p_child_id
        AND at.created_at::date BETWEEN p_start_date AND p_end_date
    )
    SELECT jsonb_build_object(
      'outcome_id', v_outcome_record.id,
      'outcome_title', v_outcome_record.title,
      'weekly_target_days', v_outcome_record.weekly_target_days,
      'completion_rate', CASE 
        WHEN tm.assigned_tasks > 0 THEN (tm.completed_tasks::numeric / tm.assigned_tasks::numeric * 100)
        ELSE 0
      END,
      'on_time_rate', CASE
        WHEN tm.completed_tasks > 0 THEN (tm.completed_on_time::numeric / tm.completed_tasks::numeric * 100)
        ELSE 0
      END,
      'streak_days', COALESCE(tm.streak_days, 0),
      'median_time_to_complete_minutes', COALESCE(tm.median_time_to_complete_minutes, 0),
      'median_approval_latency_minutes', COALESCE(tm.median_approval_latency_minutes, 0),
      'reminder_count', COALESCE(tm.reminder_count, 0),
      'assigned_tasks', COALESCE(tm.assigned_tasks, 0),
      'completed_tasks', COALESCE(tm.completed_tasks, 0)
    ) INTO v_result
    FROM task_metrics tm;

    v_outcomes := v_outcomes || jsonb_build_array(v_result);
  END LOOP;

  RETURN jsonb_build_object(
    'child_id', p_child_id,
    'date_range', jsonb_build_object('start', p_start_date, 'end', p_end_date),
    'outcomes', v_outcomes
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION public.map_task_to_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_task_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_outcome_metrics TO authenticated;

