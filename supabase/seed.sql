-- Seed Data for Task For Time

-- Note: In a real scenario, we would need to create the auth.users entries first.
-- Since we cannot easily seed auth.users from here without raw access or a seed wrapper,
-- we will assume the User has created an Account or we are running this in a local Supabase instance where we can mock auth.
-- FOR THE PURPOSE OF THIS TASK: We will insert data assuming UUIDs for users are known or generated.
-- If you claim strict 'auth.users' references, the below might fail if those users don't exist.
-- Ideally, you'd run this AFTER signing up a user. 

-- However, to satisfy "11) SEED DATA (MANDATORY)", here is the SQL.

DO $$
DECLARE
  v_parent_id uuid := gen_random_uuid(); -- Setup script would normally capture this from auth.users
  v_child_auth_id uuid := gen_random_uuid();
  v_family_id uuid;
  v_child_id uuid;
BEGIN
  -- 1. Create Family
  INSERT INTO public.families (name, created_by)
  VALUES ('Smith Family', v_parent_id)
  RETURNING id INTO v_family_id;

  -- 2. Create Parent Profile
  -- Note: We are simulating that auth.users entry exists for v_parent_id
  INSERT INTO public.profiles (id, role, display_name, family_id)
  VALUES (v_parent_id, 'parent', 'Jane Smith', v_family_id);

  -- 3. Create Child
  INSERT INTO public.children (family_id, name, avatar_url, level, xp, time_bank_minutes, auth_user_id)
  VALUES (v_family_id, 'Leo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', 3, 250, 45, v_child_auth_id)
  RETURNING id INTO v_child_id;

  -- 4. Create Child Profile
  INSERT INTO public.profiles (id, role, display_name, family_id)
  VALUES (v_child_auth_id, 'child', 'Leo', v_family_id);

  -- 5. Create Tasks (6 tasks matching UI language)
  INSERT INTO public.tasks (family_id, title, description, category, reward_minutes, requires_approval, active)
  VALUES 
  (v_family_id, 'Clean Bedroom', 'Pick up clothes and make bed', 'Home', 15, true, true),
  (v_family_id, 'Read 30 Mins', 'Read a book of your choice', 'Education', 30, true, true),
  (v_family_id, 'Empty Dishwasher', 'Put away clean dishes', 'Home', 10, true, true),
  (v_family_id, 'Walk the Dog', 'Take Buster for a walk around the block', 'Home', 20, true, true),
  (v_family_id, 'Math Homework', 'Complete math worksheet', 'Education', 25, true, true),
  (v_family_id, 'Practice Piano', '20 minutes practice', 'Skill', 20, true, true);

  -- 6. Create Rewards
  INSERT INTO public.rewards (family_id, title, cost_minutes, icon, status)
  VALUES 
  (v_family_id, '1 Hour Gaming', 60, 'videogame_asset', 'available'),
  (v_family_id, 'Extra Dessert', 30, 'icecream', 'available'),
  (v_family_id, 'Pick Movie Night', 120, 'movie', 'available'),
  (v_family_id, 'Lego Set', 300, 'toys', 'available');

  -- 7. Create Settings
  INSERT INTO public.settings (family_id, dark_mode_default, notifications_enabled)
  VALUES (v_family_id, false, true);

  RAISE NOTICE 'Seed data inserted successfully for Smith Family.';
END $$;
