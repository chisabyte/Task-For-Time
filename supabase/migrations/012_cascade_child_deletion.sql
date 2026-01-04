-- ============================================
-- Cascade Child Deletion: Handle data cleanup when children are soft-deleted
-- ============================================

-- This migration adds triggers to properly handle child deletion cascades
-- When a child is soft-deleted (deleted_at is set), we need to clean up or hide their associated data

-- 1) Add deleted_at column to assigned_tasks if it doesn't exist
-- This allows us to soft-delete tasks when their child is deleted
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'assigned_tasks'
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.assigned_tasks ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- 2) Create trigger function to cascade soft delete to assigned_tasks
CREATE OR REPLACE FUNCTION public.cascade_child_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if deleted_at was just set (soft delete operation)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft delete all assigned tasks for this child
    UPDATE public.assigned_tasks
    SET deleted_at = NEW.deleted_at
    WHERE child_id = NEW.id
    AND deleted_at IS NULL;

    -- Note: We don't delete quests or other family-wide data
    -- The quest progress calculation already filters out deleted children
    -- Other child-specific data (savings_goals, star_bank_transactions, etc.)
    -- will remain for historical purposes but won't be displayed due to child filtering

    RAISE NOTICE 'Cascaded soft delete for child % to % assigned tasks', NEW.id, (
      SELECT COUNT(*) FROM public.assigned_tasks WHERE child_id = NEW.id AND deleted_at = NEW.deleted_at
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Create trigger on children table
DROP TRIGGER IF EXISTS trigger_cascade_child_soft_delete ON public.children;
CREATE TRIGGER trigger_cascade_child_soft_delete
  AFTER UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_child_soft_delete();

-- 4) Update existing RLS policies for assigned_tasks to respect deleted_at
-- Update the existing SELECT policy to filter out deleted tasks
DROP POLICY IF EXISTS "Users can view assigned tasks in their family" ON public.assigned_tasks;
CREATE POLICY "Users can view assigned tasks in their family" ON public.assigned_tasks
  FOR SELECT USING (
    family_id = public.get_user_family_id()
    AND deleted_at IS NULL
  );

-- Update INSERT policy to ensure we're not assigning to deleted children (already exists in schema)
-- The existing validation trigger already handles this

-- 5) Add index on deleted_at for performance
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_deleted_at ON public.assigned_tasks(deleted_at) WHERE deleted_at IS NULL;

-- 6) Update get_quest_progress to explicitly filter deleted assigned_tasks
CREATE OR REPLACE FUNCTION public.get_quest_progress(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_quest record;
  v_total_assigned bigint;
  v_total_completed bigint;
  v_completion_rate numeric;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest FROM public.family_quests WHERE id = p_quest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  -- Verify access (can view if in same family)
  IF v_quest.family_id != (SELECT family_id FROM public.profiles WHERE id = auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Calculate totals from assigned_tasks, filtering out:
  -- 1. Deleted children (c.deleted_at IS NULL)
  -- 2. Deleted tasks (t.deleted_at IS NULL)
  SELECT
    COUNT(t.id) as total_assigned,
    COUNT(t.id) FILTER (WHERE t.status IN ('ready_for_review', 'approved')) as total_done
  INTO v_total_assigned, v_total_completed
  FROM public.assigned_tasks t
  JOIN public.children c ON t.child_id = c.id
  WHERE t.family_id = v_quest.family_id
    AND c.deleted_at IS NULL
    AND t.deleted_at IS NULL
    AND t.created_at BETWEEN v_quest.start_date AND v_quest.end_date;

  IF v_total_assigned = 0 THEN
    v_completion_rate := 0;
  ELSE
    v_completion_rate := (v_total_completed::numeric / v_total_assigned::numeric) * 100;
  END IF;

  RETURN jsonb_build_object(
    'quest_id', p_quest_id,
    'total_assigned', v_total_assigned,
    'total_completed', v_total_completed,
    'current_completion_rate', ROUND(v_completion_rate, 2),
    'target_rate', v_quest.target_completion_rate,
    'is_met', v_completion_rate >= v_quest.target_completion_rate
  );
END;
$$;
