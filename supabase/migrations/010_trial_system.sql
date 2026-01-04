-- Migration: Add trial system to profiles table
-- Run this in Supabase SQL Editor

-- Add trial and plan columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro')),
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Set default trial_ends_at for existing users (30 days from now)
UPDATE public.profiles
SET trial_ends_at = now() + interval '30 days'
WHERE trial_ends_at IS NULL;

-- Create upgrade_intents table for upgrade modal
CREATE TABLE IF NOT EXISTS public.upgrade_intents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  family_id uuid NOT NULL REFERENCES public.families(id),
  email text NOT NULL,
  source text NOT NULL, -- 'banner', 'coaching', 'reports', 'analytics', etc.
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on upgrade_intents
ALTER TABLE public.upgrade_intents ENABLE ROW LEVEL SECURITY;

-- Users can insert their own upgrade intents
CREATE POLICY "Users can create their own upgrade intents" ON public.upgrade_intents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own upgrade intents
CREATE POLICY "Users can view their own upgrade intents" ON public.upgrade_intents
  FOR SELECT USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_upgrade_intents_user_id ON public.upgrade_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_intents_family_id ON public.upgrade_intents(family_id);

