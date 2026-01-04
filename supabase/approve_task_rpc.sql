-- Atomic Task Approval RPC Function
-- Replaces multi-step approval logic with single transaction
-- Prevents race conditions and ensures idempotency

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

  -- 8. Return success with updated values
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_task(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.approve_task IS 
'Atomically approves a task and updates child stats. Idempotent - safe to call multiple times. Prevents race conditions with row-level locking. Uses auth.uid() for security.';

