# Migration Instructions

## Prerequisites

1. Access to Supabase SQL Editor
2. Backup your database (recommended)
3. Ensure you have the latest schema

## Step-by-Step Migration

### 1. Run Database Migrations

Execute these SQL files in order in your Supabase SQL Editor:

```sql
-- 1. Create tables and RLS policies
-- Run: supabase/migrations/001_outcomes_system.sql

-- 2. Create RPC functions for outcomes
-- Run: supabase/migrations/002_outcomes_rpc_functions.sql

-- 3. Create automation and reporting functions
-- Run: supabase/migrations/003_automation_rpc_functions.sql

-- 4. Update approve_task and add triggers
-- Run: supabase/migrations/004_update_approve_task_with_events.sql
```

### 2. Verify Migrations

Run these queries to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('outcomes', 'outcome_tasks', 'task_events', 'coaching_insights', 'auto_approval_policies');

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('upsert_outcome', 'map_task_to_outcome', 'record_task_event', 
                     'compute_outcome_metrics', 'apply_auto_approval', 'generate_weekly_report', 
                     'generate_coaching_signals');

-- Test a simple RPC
SELECT public.upsert_outcome(
  NULL::uuid,
  'Test Outcome'::text,
  'Test description'::text,
  NULL::text,
  NULL::text,
  5::int,
  true::boolean
);
```

### 3. Update TypeScript Types

If using Supabase CLI:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

Or manually add types for new tables (see IMPLEMENTATION_SUMMARY.md for schema).

### 4. Environment Variables

Add to `.env.local`:

```bash
# Optional: For AI coaching (OpenAI)
OPENAI_API_KEY=sk-...

# Required: For API routes (server-side)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Test Core Functionality

1. **Create an Outcome:**
   - Navigate to `/parent/outcomes`
   - Click "Create Outcome"
   - Fill form and save

2. **Map a Task:**
   - Click "Manage Tasks" on an outcome
   - Map an existing task or template

3. **Generate Coaching:**
   - Navigate to `/parent/coaching`
   - Select a child (optional)
   - Click "Generate Insights"

4. **Test Auto-Approval:**
   - Navigate to `/parent/approvals`
   - Click "Auto-Approve All"
   - Verify tasks are approved

5. **Generate Report:**
   - Navigate to `/parent/reports`
   - Click "Generate"
   - Verify report displays

## Rollback (if needed)

If you need to rollback:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_record_assigned_task_event ON public.assigned_tasks;
DROP TRIGGER IF EXISTS trigger_record_completed_task_event ON public.assigned_tasks;
DROP TRIGGER IF EXISTS trigger_update_assigned_tasks_updated_at ON public.assigned_tasks;

-- Drop functions
DROP FUNCTION IF EXISTS public.upsert_outcome CASCADE;
DROP FUNCTION IF EXISTS public.map_task_to_outcome CASCADE;
DROP FUNCTION IF EXISTS public.record_task_event CASCADE;
DROP FUNCTION IF EXISTS public.compute_outcome_metrics CASCADE;
DROP FUNCTION IF EXISTS public.apply_auto_approval CASCADE;
DROP FUNCTION IF EXISTS public.generate_weekly_report CASCADE;
DROP FUNCTION IF EXISTS public.generate_coaching_signals CASCADE;
DROP FUNCTION IF EXISTS public.record_assigned_task_event CASCADE;
DROP FUNCTION IF EXISTS public.record_completed_task_event CASCADE;
DROP FUNCTION IF EXISTS public.update_assigned_tasks_updated_at CASCADE;

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.coaching_insights CASCADE;
DROP TABLE IF EXISTS public.auto_approval_policies CASCADE;
DROP TABLE IF EXISTS public.task_events CASCADE;
DROP TABLE IF EXISTS public.outcome_tasks CASCADE;
DROP TABLE IF EXISTS public.outcomes CASCADE;

-- Restore original approve_task (if you have a backup)
-- Or manually restore from approve_task_rpc.sql
```

## Troubleshooting

### Error: "function does not exist"
- Ensure you ran migrations in order
- Check function names match exactly

### Error: "permission denied"
- Verify RLS policies are created
- Check user has 'parent' role

### Error: "relation does not exist"
- Ensure tables were created
- Check schema name is 'public'

### Auto-approval not working
- Verify policies are active
- Check task meets policy criteria
- Review RPC logs for errors

### Coaching API returns errors
- Check OPENAI_API_KEY is set (optional)
- Verify fallback deterministic insights work
- Check API route logs

## Support

For issues, check:
1. Supabase logs (Dashboard > Logs)
2. Browser console for frontend errors
3. Network tab for API errors
4. IMPLEMENTATION_SUMMARY.md for details

