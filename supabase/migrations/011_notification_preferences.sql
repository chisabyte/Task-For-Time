-- Migration: Add notification preferences to profiles table
-- Run this in Supabase SQL Editor

-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_task_approvals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_daily_summary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_product_updates BOOLEAN DEFAULT true;

-- Set defaults for existing users
UPDATE public.profiles
SET 
    notify_task_approvals = COALESCE(notify_task_approvals, true),
    notify_daily_summary = COALESCE(notify_daily_summary, false),
    notify_product_updates = COALESCE(notify_product_updates, true)
WHERE notify_task_approvals IS NULL 
   OR notify_daily_summary IS NULL 
   OR notify_product_updates IS NULL;

