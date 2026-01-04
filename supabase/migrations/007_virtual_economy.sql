-- ============================================
-- Virtual Economy: Stars, Savings & Interest
-- ============================================

-- 1) STARS_LEDGER TABLE
-- Transaction log for all star movements
CREATE TABLE IF NOT EXISTS public.stars_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  delta int NOT NULL, -- Positive for earnings, negative for spending
  reason text NOT NULL, -- e.g., "Task: Make Bed", "Interest Payment", "Parent Bonus", "Savings Goal: New Bike"
  transaction_type text NOT NULL CHECK (transaction_type IN ('task_reward', 'interest', 'parent_bonus', 'parent_reset', 'savings_deposit', 'savings_withdrawal', 'reward_redemption')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2) SAVINGS_GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_stars int NOT NULL CHECK (target_stars > 0),
  current_stars int DEFAULT 0 NOT NULL CHECK (current_stars >= 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- 3) INTEREST_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.interest_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE UNIQUE,
  weekly_rate numeric(4,2) DEFAULT 0 NOT NULL CHECK (weekly_rate >= 0 AND weekly_rate <= 5.00),
  last_applied_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.stars_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_settings ENABLE ROW LEVEL SECURITY;

-- Stars Ledger: Users can view their family's transactions
CREATE POLICY "Users can view stars ledger in their family" ON public.stars_ledger
  FOR SELECT USING (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id())
  );

-- Stars Ledger: System can insert via triggers/RPCs
CREATE POLICY "System can insert stars ledger" ON public.stars_ledger
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id())
  );

-- Savings Goals: Users can view their family's goals
CREATE POLICY "Users can view savings goals in their family" ON public.savings_goals
  FOR SELECT USING (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id())
  );

-- Savings Goals: Children can manage their own goals
CREATE POLICY "Children can manage their savings goals" ON public.savings_goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND auth_user_id = auth.uid())
  );

-- Savings Goals: Parents can view/manage all goals
CREATE POLICY "Parents can manage savings goals" ON public.savings_goals
  FOR ALL USING (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Interest Settings: Users can view settings in their family
CREATE POLICY "Users can view interest settings in their family" ON public.interest_settings
  FOR SELECT USING (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id())
  );

-- Interest Settings: Parents can manage
CREATE POLICY "Parents can manage interest settings" ON public.interest_settings
  FOR ALL USING (
    child_id IN (SELECT id FROM public.children WHERE family_id = public.get_user_family_id()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stars_ledger_child_id ON public.stars_ledger(child_id);
CREATE INDEX IF NOT EXISTS idx_stars_ledger_created_at ON public.stars_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_savings_goals_child_id ON public.savings_goals(child_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON public.savings_goals(status);
CREATE INDEX IF NOT EXISTS idx_interest_settings_child_id ON public.interest_settings(child_id);

-- 4) HELPER FUNCTION: Get Current Stars Balance
CREATE OR REPLACE FUNCTION public.get_stars_balance(p_child_id uuid)
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(delta), 0)::int
  FROM public.stars_ledger
  WHERE child_id = p_child_id;
$$;

-- 5) RPC: Adjust Stars (Parent Tool)
CREATE OR REPLACE FUNCTION public.adjust_stars(
  p_child_id uuid,
  p_delta int,
  p_reason text,
  p_transaction_type text DEFAULT 'parent_bonus'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is a parent in the same family
  IF NOT EXISTS (
    SELECT 1 FROM public.children c
    JOIN public.profiles p ON p.family_id = c.family_id
    WHERE c.id = p_child_id
    AND p.id = auth.uid()
    AND p.role = 'parent'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only parents can adjust stars.';
  END IF;

  -- Insert ledger entry
  INSERT INTO public.stars_ledger (child_id, delta, reason, transaction_type)
  VALUES (p_child_id, p_delta, p_reason, p_transaction_type);
END;
$$;

-- 6) RPC: Apply Weekly Interest
CREATE OR REPLACE FUNCTION public.apply_weekly_interest()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting record;
  v_current_balance int;
  v_interest_earned int;
  v_results jsonb := '[]'::jsonb;
BEGIN
  FOR v_setting IN
    SELECT * FROM public.interest_settings
    WHERE weekly_rate > 0
    AND (last_applied_at IS NULL OR last_applied_at < now() - INTERVAL '7 days')
  LOOP
    -- Get current balance
    v_current_balance := public.get_stars_balance(v_setting.child_id);
    
    -- Calculate interest (only on positive balances)
    IF v_current_balance > 0 THEN
      v_interest_earned := FLOOR(v_current_balance * (v_setting.weekly_rate / 100));
      
      IF v_interest_earned > 0 THEN
        -- Add interest to ledger
        INSERT INTO public.stars_ledger (child_id, delta, reason, transaction_type)
        VALUES (
          v_setting.child_id,
          v_interest_earned,
          'Weekly interest (' || v_setting.weekly_rate || '%)',
          'interest'
        );
        
        -- Update last applied timestamp
        UPDATE public.interest_settings
        SET last_applied_at = now()
        WHERE id = v_setting.id;
        
        v_results := v_results || jsonb_build_object(
          'child_id', v_setting.child_id,
          'interest_earned', v_interest_earned,
          'rate', v_setting.weekly_rate
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('results', v_results, 'applied_at', now());
END;
$$;

-- 7) TRIGGER: Auto-log task rewards to stars ledger
CREATE OR REPLACE FUNCTION public.log_task_reward_to_stars()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is approved, log the reward to stars ledger
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.stars_ledger (child_id, delta, reason, transaction_type)
    VALUES (
      NEW.child_id,
      NEW.reward_minutes, -- Using reward_minutes as stars (1:1 conversion)
      'Task: ' || NEW.title,
      'task_reward'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_task_reward_to_stars
  AFTER UPDATE OF status ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_reward_to_stars();

-- 8) TRIGGER: Auto-complete savings goals
CREATE OR REPLACE FUNCTION public.check_savings_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_goal record;
  v_balance int;
BEGIN
  -- When stars are added, check if any active goals are now complete
  IF NEW.delta > 0 THEN
    v_balance := public.get_stars_balance(NEW.child_id);
    
    FOR v_goal IN
      SELECT * FROM public.savings_goals
      WHERE child_id = NEW.child_id
      AND status = 'active'
      AND current_stars < target_stars
    LOOP
      -- Update goal progress
      UPDATE public.savings_goals
      SET current_stars = LEAST(v_balance, target_stars),
          status = CASE WHEN v_balance >= target_stars THEN 'completed' ELSE 'active' END,
          completed_at = CASE WHEN v_balance >= target_stars THEN now() ELSE NULL END
      WHERE id = v_goal.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_savings_goal_completion
  AFTER INSERT ON public.stars_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.check_savings_goal_completion();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_stars_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stars TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_weekly_interest TO authenticated;
