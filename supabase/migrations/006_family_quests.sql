-- ============================================
-- Family Quests: Shared Goals System
-- ============================================

-- 1) FAMILY_QUESTS TABLE
CREATE TABLE IF NOT EXISTS public.family_quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  reward_description text NOT NULL,
  target_completion_rate int NOT NULL CHECK (target_completion_rate > 0 AND target_completion_rate <= 100),
  start_date timestamptz DEFAULT now() NOT NULL,
  end_date timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.family_quests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view quests in their family') THEN
        CREATE POLICY "Users can view quests in their family" ON public.family_quests
          FOR SELECT USING (family_id = public.get_user_family_id());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can manage quests') THEN
        CREATE POLICY "Parents can manage quests" ON public.family_quests
          FOR ALL USING (
            family_id = public.get_user_family_id() AND 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
          );
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_quests_family_id ON public.family_quests(family_id);
CREATE INDEX IF NOT EXISTS idx_family_quests_status ON public.family_quests(status);

-- 2) GET_QUEST_PROGRESS RPC
-- Calculates the current completion rate for a quest
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

  -- Calculate totals from task_events
  -- Assigned: unique assigned_task_id between start and end date
  -- Completed: unique assigned_task_id with event_type = 'completed' or 'approved'
  
  -- Alternatively, just look at assigned_tasks table created_at
  SELECT 
    COUNT(t.id) as total_assigned,
    COUNT(t.id) FILTER (WHERE t.status IN ('ready_for_review', 'approved')) as total_done
  INTO v_total_assigned, v_total_completed
  FROM public.assigned_tasks t
  JOIN public.children c ON t.child_id = c.id
  WHERE t.family_id = v_quest.family_id
    AND c.deleted_at IS NULL
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

-- 3) AUTO-COMPLETE QUEST TRIGGER
CREATE OR REPLACE FUNCTION public.check_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_quest record;
  v_progress jsonb;
BEGIN
  -- We only care about status updates to 'approved' or 'ready_for_review'
  IF NEW.status IN ('ready_for_review', 'approved') THEN
    -- Find active quests for this family
    FOR v_quest IN 
      SELECT * FROM public.family_quests 
      WHERE family_id = NEW.family_id 
      AND status = 'active'
      AND now() BETWEEN start_date AND end_date
    LOOP
      -- Calculate progress
      v_progress := public.get_quest_progress(v_quest.id);
      
      -- If target met, update quest status
      IF (v_progress->>'is_met')::boolean THEN
        UPDATE public.family_quests 
        SET status = 'completed' 
        WHERE id = v_quest.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_quest_completion ON public.assigned_tasks;
CREATE TRIGGER trigger_check_quest_completion
  AFTER UPDATE OF status ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_quest_completion();
