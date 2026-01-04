-- ============================================
-- Coach Insights Weekly System
-- Creates table for automatic weekly coach insights
-- ============================================

-- COACH_INSIGHTS TABLE
-- Stores automatically generated weekly coaching insights
CREATE TABLE IF NOT EXISTS public.coach_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('family', 'child')),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  outcome_filter text,
  title text NOT NULL,
  observation text NOT NULL,
  diagnosis text NOT NULL,
  recommendation text NOT NULL,
  expected_result text NOT NULL,
  next_check text NOT NULL,
  impact_score int NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by text NOT NULL CHECK (created_by IN ('system', 'manual')),
  source_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Ensure child_id is set when scope is 'child'
  CONSTRAINT coach_insights_child_scope_check CHECK (
    (scope = 'family' AND child_id IS NULL) OR
    (scope = 'child' AND child_id IS NOT NULL)
  )
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_coach_insights_family_week ON public.coach_insights(family_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_coach_insights_family_created ON public.coach_insights(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_insights_family_scope_child_week ON public.coach_insights(family_id, scope, child_id, week_start);

-- RLS POLICIES
ALTER TABLE public.coach_insights ENABLE ROW LEVEL SECURITY;

-- Parents can SELECT only insights for their family
CREATE POLICY "Parents can view coach insights in their family" ON public.coach_insights
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Parents can INSERT manual insights only for their family
CREATE POLICY "Parents can insert manual coach insights" ON public.coach_insights
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND
    created_by = 'manual' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Note: System jobs (service role) can INSERT via service role key (bypasses RLS)
-- This is handled by using service_role key in Edge Functions, which bypasses RLS

