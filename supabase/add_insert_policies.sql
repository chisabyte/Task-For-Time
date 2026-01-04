-- Add missing INSERT policies for profiles and families tables
-- Run this in your Supabase SQL Editor

-- Allow users to create their own profile on signup
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to create a family
CREATE POLICY "Users can create a family" ON public.families
  FOR INSERT WITH CHECK (created_by = auth.uid());

