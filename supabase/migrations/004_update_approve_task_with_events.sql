-- ============================================
-- Update approve_task to record events
-- Add trigger to auto-record task events
-- ============================================

-- Update approve_task to record 'approved' event
CREATE OR REPLACE FUNCTION public.approve_task(
  p_task_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task record;
  v_child record;
  v_family_id uuid;
  v_parent_id uuid;
  v_new_xp int;
  v_new_level int;
  v_new_time_bank int;
  v_already_approved boolean := false;
BEGIN
  -- 1. Get current user (parent)
  v_parent_id := auth.uid();
  
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  -- 2. Authorization: Verify caller is a parent
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_parent_id 
    AND role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only parents can approve tasks.';
  END IF;

  -- 3. Get parent's family_id
  SELECT family_id INTO v_family_id
  FROM public.profiles
  WHERE id = v_parent_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Parent profile not found or has no family.';
  END IF;

  -- 4. Get task details with lock (FOR UPDATE prevents concurrent modifications)
  SELECT * INTO v_task
  FROM public.assigned_tasks
  WHERE id = p_task_id
    AND family_id = v_family_id
    AND status = 'ready_for_review'
  FOR UPDATE; -- Row-level lock prevents concurrent approvals

  IF NOT FOUND THEN
    -- Check if already approved (idempotency check)
    SELECT EXISTS(
      SELECT 1 FROM public.assigned_tasks
      WHERE id = p_task_id
        AND status = 'approved'
    ) INTO v_already_approved;

    IF v_already_approved THEN
      -- Idempotent: return success without error
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Task already approved',
        'idempotent', true
      );
    END IF;

    RAISE EXCEPTION 'Task not found, not ready for review, or access denied.';
  END IF;

  -- 5. Get child details
  SELECT * INTO v_child
  FROM public.children
  WHERE id = v_task.child_id
    AND family_id = v_family_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found or deleted.';
  END IF;

  -- 6. Calculate new values atomically
  v_new_xp := v_child.xp + 10; -- Fixed XP per task
  v_new_level := 1 + floor(v_new_xp / 100); -- Level calculation
  v_new_time_bank := v_child.time_bank_minutes + v_task.reward_minutes;

  -- 7. Atomic update: Task status + Child stats in single transaction
  UPDATE public.assigned_tasks
  SET status = 'approved'
  WHERE id = p_task_id;

  UPDATE public.children
  SET 
    time_bank_minutes = v_new_time_bank,
    xp = v_new_xp,
    level = v_new_level
  WHERE id = v_task.child_id;

  -- 8. Record 'approved' event
  INSERT INTO public.task_events (family_id, child_id, assigned_task_id, event_type, event_data)
  VALUES (
    v_family_id,
    v_task.child_id,
    p_task_id,
    'approved',
    jsonb_build_object(
      'approved_by', v_parent_id,
      'reward_minutes', v_task.reward_minutes,
      'new_xp', v_new_xp,
      'new_level', v_new_level
    )
  );

  -- 9. Return success with updated values
  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'child_id', v_task.child_id,
    'reward_minutes', v_task.reward_minutes,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'new_time_bank', v_new_time_bank,
    'idempotent', false
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic in plpgsql functions
    RAISE EXCEPTION 'Failed to approve task: %', SQLERRM;
END;
$$;

-- Trigger to auto-record 'assigned' event when task is created
CREATE OR REPLACE FUNCTION public.record_assigned_task_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Record 'assigned' event when task is created with status 'active'
  IF NEW.status = 'active' THEN
    INSERT INTO public.task_events (family_id, child_id, assigned_task_id, event_type, event_data)
    VALUES (
      NEW.family_id,
      NEW.child_id,
      NEW.id,
      'assigned',
      jsonb_build_object(
        'assigned_by', NEW.created_by,
        'reward_minutes', NEW.reward_minutes,
        'requires_approval', NEW.requires_approval
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_assigned_task_event ON public.assigned_tasks;
CREATE TRIGGER trigger_record_assigned_task_event
  AFTER INSERT ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.record_assigned_task_event();

-- Trigger to auto-record 'completed' event when task status changes to 'ready_for_review'
CREATE OR REPLACE FUNCTION public.record_completed_task_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Record 'completed' event when status changes from 'active' to 'ready_for_review'
  IF OLD.status = 'active' AND NEW.status = 'ready_for_review' THEN
    INSERT INTO public.task_events (family_id, child_id, assigned_task_id, event_type, event_data)
    VALUES (
      NEW.family_id,
      NEW.child_id,
      NEW.id,
      'completed',
      jsonb_build_object(
        'completed_at', NEW.updated_at,
        'time_to_complete_minutes', EXTRACT(EPOCH FROM (NEW.updated_at - OLD.created_at)) / 60
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assigned_tasks' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.assigned_tasks ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_assigned_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assigned_tasks_updated_at ON public.assigned_tasks;
CREATE TRIGGER trigger_update_assigned_tasks_updated_at
  BEFORE UPDATE ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assigned_tasks_updated_at();

DROP TRIGGER IF EXISTS trigger_record_completed_task_event ON public.assigned_tasks;
CREATE TRIGGER trigger_record_completed_task_event
  AFTER UPDATE ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completed_task_event();

