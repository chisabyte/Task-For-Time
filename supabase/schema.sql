-- 1) Tables
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('parent', 'child')),
  display_name text NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE public.families (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.children (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  name text NOT NULL,
  avatar_url text,
  level int DEFAULT 1 NOT NULL,
  xp int DEFAULT 0 NOT NULL,
  time_bank_minutes int DEFAULT 0 NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz -- Soft delete support
);

CREATE TABLE public.rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  title text NOT NULL,
  cost_minutes int NOT NULL,
  icon text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'consumed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.reward_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  child_id uuid NOT NULL REFERENCES public.children(id),
  reward_id uuid NOT NULL REFERENCES public.rewards(id),
  minutes_spent int NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  title text NOT NULL,
  description text,
  category text,
  reward_minutes int NOT NULL,
  requires_approval boolean DEFAULT true NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  child_id uuid NOT NULL REFERENCES public.children(id),
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'discuss')),
  note text,
  proof_image_path text,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.settings (
  family_id uuid PRIMARY KEY REFERENCES public.families(id),
  dark_mode_default boolean DEFAULT false NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL
);

-- Task Templates (reusable task definitions without child assignment)
CREATE TABLE public.task_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  title text NOT NULL,
  description text,
  category text,
  default_reward_minutes int NOT NULL,
  requires_approval boolean DEFAULT true NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Assigned Tasks (tasks assigned to specific children)
CREATE TABLE public.assigned_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id),
  child_id uuid NOT NULL REFERENCES public.children(id),
  template_id uuid REFERENCES public.task_templates(id),
  title text NOT NULL,
  description text,
  category text,
  reward_minutes int NOT NULL,
  requires_approval boolean DEFAULT true NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'ready_for_review', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes for new tables
CREATE INDEX idx_task_templates_family_id ON public.task_templates(family_id);
CREATE INDEX idx_assigned_tasks_family_id ON public.assigned_tasks(family_id);
CREATE INDEX idx_assigned_tasks_child_id ON public.assigned_tasks(child_id);
CREATE INDEX idx_assigned_tasks_status ON public.assigned_tasks(status);

-- 2) RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's family_id
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Profiles: Users can view profiles in their family.
CREATE POLICY "Users can view profiles in their family" ON public.profiles
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Profiles: Users can insert their own profile on signup.
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Families: Users can view their own family.
CREATE POLICY "Users can view their own family" ON public.families
  FOR SELECT USING (id = public.get_user_family_id());

-- Families: Users can create a family.
CREATE POLICY "Users can create a family" ON public.families
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Children: Users can view children in their family.
CREATE POLICY "Users can view children in their family" ON public.children
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Tasks: Users can view tasks in their family.
CREATE POLICY "Users can view tasks in their family" ON public.tasks
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Submissions: Users can view submissions in their family.
CREATE POLICY "Users can view submissions in their family" ON public.submissions
  FOR SELECT USING (family_id = public.get_user_family_id());
  
-- Submissions: Children can insert (submit) tasks.
CREATE POLICY "Children can submit tasks" ON public.submissions
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND
    auth.uid() IN (SELECT auth_user_id FROM public.children WHERE id = child_id)
  );

-- Settings: Users can view settings for their family.
CREATE POLICY "Users can view settings for their family" ON public.settings
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Rewards: Users can view rewards in their family.
CREATE POLICY "Users can view rewards in their family" ON public.rewards
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Rewards: Parents can manage rewards.
CREATE POLICY "Parents can manage rewards" ON public.rewards
  FOR ALL USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Reward Redemptions: Parents and the specific child can view.
CREATE POLICY "Users can view redemptions in their family" ON public.reward_redemptions
  FOR SELECT USING (
    family_id = public.get_user_family_id() AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent') OR
      child_id IN (SELECT id FROM public.children WHERE auth_user_id = auth.uid())
    )
  );
-- Direct inserts/updates/deletes are disabled (not defined here, so default deny).

-- Task Templates: Users can view templates in their family
CREATE POLICY "Users can view task templates in their family" ON public.task_templates
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Task Templates: Parents can insert templates
CREATE POLICY "Parents can insert task templates" ON public.task_templates
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Task Templates: Parents can update templates
CREATE POLICY "Parents can update task templates" ON public.task_templates
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Task Templates: Parents can delete templates
CREATE POLICY "Parents can delete task templates" ON public.task_templates
  FOR DELETE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Assigned Tasks: Users can view assigned tasks in their family
CREATE POLICY "Users can view assigned tasks in their family" ON public.assigned_tasks
  FOR SELECT USING (family_id = public.get_user_family_id());

-- Assigned Tasks: Parents can insert (child_id must belong to same family)
CREATE POLICY "Parents can insert assigned tasks" ON public.assigned_tasks
  FOR INSERT WITH CHECK (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent') AND
    EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND family_id = public.get_user_family_id() AND deleted_at IS NULL)
  );

-- Assigned Tasks: Parents can update
CREATE POLICY "Parents can update assigned tasks" ON public.assigned_tasks
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Assigned Tasks: Parents can delete
CREATE POLICY "Parents can delete assigned tasks" ON public.assigned_tasks
  FOR DELETE USING (
    family_id = public.get_user_family_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent')
  );

-- Assigned Tasks: Children can update status of their own tasks
CREATE POLICY "Children can update their assigned task status" ON public.assigned_tasks
  FOR UPDATE USING (
    family_id = public.get_user_family_id() AND
    EXISTS (SELECT 1 FROM public.children WHERE id = child_id AND auth_user_id = auth.uid())
  );

-- Trigger to validate child_id belongs to family_id
CREATE OR REPLACE FUNCTION public.validate_assigned_task_child()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.children 
    WHERE id = NEW.child_id 
    AND family_id = NEW.family_id 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'child_id must belong to the same family_id and not be deleted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_assigned_task_child
  BEFORE INSERT OR UPDATE ON public.assigned_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assigned_task_child();

-- 3) RPC Functions

-- approve_submission
CREATE OR REPLACE FUNCTION public.approve_submission(submission_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_submission record;
  v_task_reward int;
  v_child_id uuid;
BEGIN
  -- Check if caller is a parent
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent') THEN
    RAISE EXCEPTION 'Access denied. Only parents can approve.';
  END IF;

  -- Get submission details
  SELECT * INTO v_submission FROM public.submissions WHERE id = submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found.';
  END IF;

  -- Verify parent belongs to same family
  IF v_submission.family_id != (SELECT family_id FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Different family.';
  END IF;

  -- Get reward minutes
  SELECT reward_minutes INTO v_task_reward FROM public.tasks WHERE id = v_submission.task_id;
  
  -- Update submission status
  UPDATE public.submissions 
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = submission_id;

  -- Update child stats (atomically)
  UPDATE public.children
  SET time_bank_minutes = time_bank_minutes + v_task_reward,
      xp = xp + 10,  -- Arbitrary XP gain per task
      level = 1 + floor((xp + 10) / 100) -- Simple level up logic
  WHERE id = v_submission.child_id;
  
END;
$$;

-- discuss_submission
CREATE OR REPLACE FUNCTION public.discuss_submission(submission_id uuid, note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
   -- Check if caller is a parent
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent') THEN
    RAISE EXCEPTION 'Access denied. Only parents can approve.';
  END IF;

  -- Update submission
  UPDATE public.submissions 
    SET status = 'discuss',
        note = discuss_submission.note,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = submission_id AND family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());
    
  IF NOT FOUND THEN
     RAISE EXCEPTION 'Submission query failed. Check ID or permissions.';
  END IF;
  
END;
$$;

-- redeem_reward
CREATE OR REPLACE FUNCTION public.redeem_reward(reward_id uuid, child_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward_cost int;
  v_child_balance int;
  v_family_id uuid;
BEGIN
  -- Get current user's family_id
  v_family_id := public.get_user_family_id();

  -- Get reward and child details with basic security check
  SELECT cost_minutes INTO v_reward_cost FROM public.rewards 
  WHERE id = redeem_reward.reward_id AND family_id = v_family_id AND status = 'available';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or not available in your family.';
  END IF;

  SELECT time_bank_minutes INTO v_child_balance FROM public.children 
  WHERE id = redeem_reward.child_id AND family_id = v_family_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found or deleted.';
  END IF;

  -- Verify authorization
  -- Either it's the child themselves OR a parent in the same family
  IF NOT (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'parent' OR
    EXISTS (SELECT 1 FROM public.children WHERE id = redeem_reward.child_id AND auth_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied. You are not authorized to redeem for this child.';
  END IF;

  -- Check balance
  IF v_child_balance < v_reward_cost THEN
    RAISE EXCEPTION 'Sufficient minutes not available.';
  END IF;

  -- Atomic Deduction and Record
  UPDATE public.children 
  SET time_bank_minutes = time_bank_minutes - v_reward_cost
  WHERE id = redeem_reward.child_id;

  INSERT INTO public.reward_redemptions (family_id, child_id, reward_id, minutes_spent)
  VALUES (v_family_id, redeem_reward.child_id, redeem_reward.reward_id, v_reward_cost);

  UPDATE public.rewards
  SET status = 'redeemed'
  WHERE id = redeem_reward.reward_id;

END;
$$;
