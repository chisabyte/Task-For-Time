# Child Deletion Fix Summary

## Problem
When children were deleted from the app, their associated data (tasks, quests) continued to appear in the child dashboard even though they no longer showed in the parent dashboard.

## Solution Overview
Implemented a comprehensive cascade soft-delete system that ensures when a child is deleted, all their associated data is properly handled.

## Changes Made

### 1. Frontend Updates

#### a) FamilyManagementSection.tsx (Parent Settings)
- **Location**: `src/app/parent/settings/components/FamilyManagementSection.tsx`
- **Changes**:
  - Added import for `exitChildMode` and `getActiveChildId` from child-session library
  - Updated `handleDeleteChild` function to:
    - Clear child session if the deleted child is currently active
    - Redirect to login/choose profile page when active child is deleted
  - This prevents stale child sessions from persisting after deletion

#### b) Child Dashboard
- **Location**: `src/app/child/dashboard/page.tsx`
- **Changes**:
  - Added `.is('deleted_at', null)` filter to assigned_tasks query (line 123)
  - Ensures deleted tasks don't show in child dashboard

#### c) Family Quest Progress Component
- **Location**: `src/app/child/components/FamilyQuestProgress.tsx`
- **Changes**:
  - Added `.is('deleted_at', null)` filter to assigned_tasks query (line 55)
  - Ensures quests only count tasks from non-deleted children with non-deleted tasks

#### d) Parent Approvals Page
- **Location**: `src/app/parent/approvals/page.tsx`
- **Changes**:
  - Added `.is('deleted_at', null)` filter to assigned_tasks query
  - Added `.is('children.deleted_at', null)` filter to exclude deleted children
  - Changed join to `children!inner(*)` to ensure inner join behavior

#### e) Parent Dashboard
- **Location**: `src/app/parent/dashboard/page.tsx`
- **Changes**:
  - Added `.is('deleted_at', null)` filter when fetching assigned_tasks (line 80)
  - Ensures task counts don't include deleted tasks

### 2. Database Migration

#### Created Migration File
- **Location**: `supabase/migrations/012_cascade_child_deletion.sql`
- **Changes**:

1. **Added `deleted_at` column to `assigned_tasks` table**
   - Enables soft-delete for tasks

2. **Created trigger function `cascade_child_soft_delete()`**
   - Automatically soft-deletes all assigned_tasks when a child is soft-deleted
   - Runs after UPDATE on children table
   - Only triggers when `deleted_at` changes from NULL to a timestamp

3. **Updated RLS Policy for assigned_tasks**
   - Modified SELECT policy to automatically filter out deleted tasks
   - Added: `AND deleted_at IS NULL` to the policy

4. **Created index on `deleted_at`**
   - Improves query performance when filtering deleted tasks
   - Partial index: only indexes non-deleted rows

5. **Updated `get_quest_progress()` function**
   - Now filters out both deleted children AND deleted tasks
   - Ensures quest progress calculations are accurate

## How to Apply the Fix

### Step 1: Apply Database Migration

You need to run the SQL migration on your Supabase database. Choose one of these methods:

#### Option A: Supabase Dashboard SQL Editor (Recommended)
1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/012_cascade_child_deletion.sql`
4. Paste into a new query
5. Click "Run"

Direct link: `https://supabase.com/dashboard/project/tdhkpvattuvffhjwfywl/sql/new`

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project (if not already linked)
supabase link --project-ref tdhkpvattuvffhjwfywl

# Apply the migration
supabase db push
```

#### Option C: Using psql (Advanced)
```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.tdhkpvattuvffhjwfywl.supabase.co:5432/postgres"

# Run the migration file
\i supabase/migrations/012_cascade_child_deletion.sql
```

### Step 2: Test the Fix

After applying the migration, test the following scenarios:

1. **Test Child Deletion**:
   - Create a test child
   - Assign some tasks to the test child
   - Create a family quest
   - Delete the test child
   - Verify:
     - ✅ Tasks no longer appear in any dashboards
     - ✅ Quest progress updates to reflect deleted child
     - ✅ If viewing as that child, you're redirected to login
     - ✅ No errors in browser console

2. **Test Quest Display**:
   - Delete all children in your family
   - Verify:
     - ✅ Quests don't show in child dashboard
     - ✅ Quests show correctly in parent dashboard (if any)

3. **Test Active Child Session**:
   - As a parent, view a child's dashboard
   - In another tab/window, delete that child
   - Verify:
     - ✅ You're redirected to login/choose profile
     - ✅ Can't access deleted child's dashboard anymore

### Step 3: Clean Up (Optional)

If you have existing deleted children with orphaned tasks, run this query to clean up:

```sql
-- Soft-delete tasks for all deleted children
UPDATE public.assigned_tasks
SET deleted_at = (
  SELECT deleted_at
  FROM public.children
  WHERE children.id = assigned_tasks.child_id
)
WHERE child_id IN (
  SELECT id FROM public.children WHERE deleted_at IS NOT NULL
)
AND deleted_at IS NULL;
```

## What Happens Now

When you delete a child:

1. **Immediate Effects**:
   - Child's `deleted_at` timestamp is set
   - Database trigger automatically sets `deleted_at` on all their assigned_tasks
   - If the child is currently active in a session, that session is cleared
   - User is redirected to login/choose profile page

2. **Data Visibility**:
   - Child no longer appears in any dashboards
   - Their tasks are hidden from all views
   - Quest progress calculations exclude their tasks
   - Historical data is preserved (soft delete) but not shown

3. **RLS Policies**:
   - Database automatically filters out deleted tasks
   - No need to add `.is('deleted_at', null)` to every query (RLS handles it)
   - Additional application-level filtering for extra safety

## Files Modified

1. `src/app/parent/settings/components/FamilyManagementSection.tsx`
2. `src/app/child/dashboard/page.tsx`
3. `src/app/child/components/FamilyQuestProgress.tsx`
4. `src/app/parent/approvals/page.tsx`
5. `src/app/parent/dashboard/page.tsx`
6. `supabase/migrations/012_cascade_child_deletion.sql` (created)

## Files to Apply

- **Database Migration**: `supabase/migrations/012_cascade_child_deletion.sql`

## Notes

- All deletes are **soft deletes** - data is preserved for historical purposes
- Quest progress automatically updates when children are deleted
- The system is idempotent - deleting an already-deleted child has no effect
- Session management ensures no stale child sessions persist after deletion
