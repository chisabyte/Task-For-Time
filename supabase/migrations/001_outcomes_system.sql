-- ============================================
-- Outcomes System Migration
-- Adds: outcomes, outcome_tasks, task_events, coaching_insights, auto_approval_policies
-- ============================================

-- 1) OUTCOMES TABLE
-- Parent-defined behavior goals (e.g., "Morning routine without reminders")
CREATE TABLE public.outcomes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  template_type text CHECK (template_type IN ('morning_routine', 'homework', 'bedtime', 'chores', 'kindness', 'custom')),
  success_criteria text, -- e.g., "Complete all 3 tasks before 8am"
  weekly_target_days int DEFAULT 5 CHECK (weekly_target_days >= 0 AND weekly_target_days <= 7),
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2) OUTCOME_TASKS MAPPING
-- Maps tasks to outcomes (many-to-many: one task can map to multiple outcomes)
CREATE TABLE public.outcome_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  outcome_id uuid NOT NULL REFERENCES public.outcomes(id) ON DELETE CASCADE,
  assigned_task_id uuid REFERENCES public.assigned_tasks(id) ON DELETE CASCADE,
  task_template_id uuid REFERENCES public.task_templates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Ensure at least one task reference exists
  CONSTRAINT outcome_tasks_task_check CHECK (
    (assigned_task_id IS NOT NULL) OR (task_template_id IS NOT NULL)
  )
);

-- 3) TASK_EVENTS TABLE
-- Event log for all task lifecycle events (assigned, completed, approved, redeemed, snoozed, nudged)
CREATE TABLE public.task_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  assigned_task_id uuid REFERENCES public.assigned_tasks(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('assigned', 'completed', 'approved', 'rejected', 'redeemed', 'snoozed', 'nudged')),
  event_data jsonb, -- Flexible JSON for event-specific data (e.g., time_to_complete, reminder_count)
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4) COACHING_INSIGHTS TABLE
-- Stores AI-generated coaching recommendations with metrics snapshots
CREATE TABLE public.coaching_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE, -- NULL = family-level insight
  outcome_id uuid REFERENCES public.outcomes(id) ON DELETE CASCADE, -- NULL = general insight
  insight_type text NOT NULL CHECK (insight_type IN ('family', 'child', 'outcome', 'parent_habit')),
  signals jsonb NOT NULL, -- Deterministic signals detected (e.g., {"evening_slump": true, "approval_drag": 45})
  metrics_snapshot jsonb NOT NULL, -- Metrics at time of generation
  observation text NOT NULL, -- Data-backed observation
  diagnosis text NOT NULL, -- Why it's happening
  recommendation text NOT NULL, -- Actionable step
  expected_result text NOT NULL, -- What should improve
  next_check text NOT NULL, -- What metric to watch
  impact_score numeric(5,2) DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 100), -- 0-100 priority score
  version int DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5) AUTO_APPROVAL_POLICIES TABLE
-- Rules for automatic task approval
CREATE TABLE public.auto_approval_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE, -- NULL = applies to all children
  outcome_id uuid REFERENCES public.outcomes(id) ON DELETE CASCADE, -- NULL = applies to all outcomes
  task_template_id uuid REFERENCES public.task_templates(id) ON DELETE CASCADE, -- NULL = applies to all tasks
  policy_type text NOT NULL CHECK (policy_type IN ('recurring_high_reliability', 'low_risk_task', 'first_time_exception', 'proof_required_exception', 'flagged_hard_exception')),
  min_completion_rate numeric(5,2) CHECK (min_completion_rate >= 0 AND min_completion_rate <= 100), -- For recurring_high_reliability
  lookback_days int DEFAULT 30 CHECK (lookback_days > 0), -- Days to check for reliability
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  -- Ensure at least one scope is defined
  CONSTRAINT auto_approval_scope_check CHECK (
    (child_id IS NOT NULL) OR (outcome_id IS NOT NULL) OR (task_template_id IS NOT NULL)
  )
);

-- 6) INDEXES FOR PERFORMANCE
CREATE INDEX idx_outcomes_family_id ON public.outcomes(family_id);
CREATE INDEX idx_outcomes_active ON public.outcomes(family_id, active) WHERE active = true;
CREATE INDEX idx_outcome_tasks_outcome_id ON public.outcome_tasks(outcome_id);
CREATE INDEX idx_outcome_tasks_assigned_task_id ON public.outcome_tasks(assigned_task_id);
CREATE INDEX idx_outcome_tasks_template_id ON public.outcome_tasks(task_template_id);
CREATE INDEX idx_task_events_family_id ON public.task_events(family_id);
CREATE INDEX idx_task_events_child_id ON public.task_events(child_id);
CREATE INDEX idx_task_events_assigned_task_id ON public.task_events(assigned_task_id);
CREATE INDEX idx_task_events_event_type ON public.task_events(event_type);
CREATE INDEX idx_task_events_created_at ON public.task_events(created_at);
CREATE INDEX idx_task_events_child_type_created ON public.task_events(child_id, event_type, created_at);
CREATE INDEX idx_coaching_insights_family_id ON public.coaching_insights(family_id);
CREATE INDEX idx_coaching_insights_child_id ON public.coaching_insights(child_id) WHERE child_id IS NOT NULL;
CREATE INDEX idx_coaching_insights_outcome_id ON public.coaching_insights(outcome_id) WHERE outcome_id IS NOT NULL;
CREATE INDEX idx_coaching_insights_created_at ON public.coaching_insights(family_id, created_at DESC);
CREATE INDEX idx_auto_approval_policies_family_id ON public.auto_approval_policies(family_id);
CREATE INDEX idx_auto_approval_policies_active ON public.auto_approval_policies(family_id, active) WHERE active = true;

-- 7) RLS POLICIES
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_policies ENABLE ROW LEVEL SECURITY;

-- Outcomes: Users can view outcomes in their family
CREATE POLICY "Users can view outcomes in their family" ON public.outcomes
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Outcomes: Parents can manage outcomes
CREATE POLICY "Parents can insert outcomes" ON public.outcomes
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can update outcomes" ON public.outcomes
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can delete outcomes" ON public.outcomes
  FOR DELETE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Outcome Tasks: Users can view mappings in their family
CREATE POLICY "Users can view outcome tasks in their family" ON public.outcome_tasks
  FOR SELECT USING (
    outcome_id IN (SELECT id FROM public.outcomes WHERE family_id = public.get_user_family_id())
  );

-- Outcome Tasks: Parents can manage mappings
CREATE POLICY "Parents can insert outcome tasks" ON public.outcome_tasks
  FOR INSERT WITH CHECK (
    outcome_id IN (SELECT id FROM public.outcomes WHERE family_id = public.get_user_family_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent'))
  );

CREATE POLICY "Parents can delete outcome tasks" ON public.outcome_tasks
  FOR DELETE USING (
    outcome_id IN (SELECT id FROM public.outcomes WHERE family_id = public.get_user_family_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent'))
  );

-- Task Events: Users can view events in their family
CREATE POLICY "Users can view task events in their family" ON public.task_events
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Task Events: System can insert (via RPC), children can insert their own events
CREATE POLICY "Children can insert task events" ON public.task_events
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND
    EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND auth_user_id = auth.uid())
  );

-- Task Events: Parents can insert (for approvals, etc.)
CREATE POLICY "Parents can insert task events" ON public.task_events
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Coaching Insights: Users can view insights in their family
CREATE POLICY "Users can view coaching insights in their family" ON public.coaching_insights
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Coaching Insights: Only system (via RPC) can insert
-- No direct INSERT policy - only via RPC functions

-- Auto Approval Policies: Users can view policies in their family
CREATE POLICY "Users can view auto approval policies in their family" ON public.auto_approval_policies
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Auto Approval Policies: Parents can manage
CREATE POLICY "Parents can insert auto approval policies" ON public.auto_approval_policies
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can update auto approval policies" ON public.auto_approval_policies
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can delete auto approval policies" ON public.auto_approval_policies
  FOR DELETE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- 8) TRIGGER: Update outcomes.updated_at
CREATE OR REPLACE FUNCTION public.update_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outcomes_updated_at
  BEFORE UPDATE ON public.outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_outcomes_updated_at();

