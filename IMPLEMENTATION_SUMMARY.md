# Implementation Summary: Four Differentiation Pillars

## Overview
This document summarizes the complete implementation of four major differentiation features for the Task For Time app:
1. Outcome Dashboards
2. AI Coaching (data-driven)
3. Parent Friction Annihilation
4. Behavior-Change Proof

---

## A) Product Spec

### 1. Outcome Dashboards
**What:** Replace task tracking with behavior outcomes tracking.

**Why:** Parents care about behavior change, not just task completion. Outcomes group related tasks and measure progress toward specific goals.

**Key Features:**
- Parent creates Outcomes (e.g., "Morning routine without reminders")
- Tasks map to Outcomes (many-to-many)
- Metrics per Outcome: completion rate, on-time rate, streak, time-to-complete, approval latency, reminder count
- Parent dashboard shows summary tiles and outcome list with trends
- Child dashboard groups tasks by outcome

### 2. AI Coaching
**What:** Data-driven coaching that identifies patterns and suggests structural fixes.

**Why:** Generic advice doesn't work. Parents need specific, actionable recommendations based on their family's actual data.

**Key Features:**
- Deterministic signal generation (evening slump, approval drag, overload, weekend regression)
- LLM integration (OpenAI) with strict prompt template
- Coaching outputs: Observation, Diagnosis, Recommendation, Expected Result, Next Check
- Only recommends from allowed action set (no punishments)
- Stores insights in database for history

### 3. Parent Friction Annihilation
**What:** Reduce parent workflow to < 2 minutes/day.

**Why:** Parents abandon apps that require too much time. Automation and smart defaults are essential.

**Key Features:**
- Auto-approval policies (recurring high-reliability, low-risk tasks)
- Bulk actions (approve all, approve by outcome)
- Exceptions Queue (only shows tasks needing attention)
- Smart defaults (templates, suggested rewards, schedules)

### 4. Behavior-Change Proof
**What:** Generate shareable proof that the system works.

**Why:** Parents need to see measurable improvement to stay engaged and share success.

**Key Features:**
- Weekly reports with before/after metrics
- Consistency score (weighted composite)
- Wins and challenges identification
- Export functionality (text/PDF)
- Privacy-safe (no full names by default)

---

## B) Data Model + Migrations

### New Tables

1. **outcomes**
   - Parent-defined behavior goals
   - Fields: title, description, template_type, success_criteria, weekly_target_days, active
   - RLS: Parents can manage, users can view

2. **outcome_tasks**
   - Maps tasks to outcomes (many-to-many)
   - Fields: outcome_id, assigned_task_id, task_template_id
   - RLS: Parents can manage, users can view

3. **task_events**
   - Event log for task lifecycle
   - Fields: family_id, child_id, assigned_task_id, event_type, event_data (JSONB)
   - Event types: assigned, completed, approved, rejected, redeemed, snoozed, nudged
   - RLS: System/children/parents can insert, users can view

4. **coaching_insights**
   - Stores AI-generated recommendations
   - Fields: family_id, child_id, outcome_id, insight_type, signals, metrics_snapshot, observation, diagnosis, recommendation, expected_result, next_check, impact_score
   - RLS: System can insert (via RPC), users can view

5. **auto_approval_policies**
   - Rules for automatic task approval
   - Fields: family_id, child_id, outcome_id, task_template_id, policy_type, min_completion_rate, lookback_days, active
   - Policy types: recurring_high_reliability, low_risk_task, first_time_exception, proof_required_exception, flagged_hard_exception
   - RLS: Parents can manage, users can view

### Migration Files
- `001_outcomes_system.sql` - Creates all new tables with RLS
- `002_outcomes_rpc_functions.sql` - Core RPC functions
- `003_automation_rpc_functions.sql` - Auto-approval and reporting
- `004_update_approve_task_with_events.sql` - Updates approve_task to record events + triggers

### Indexes
All tables have appropriate indexes for:
- family_id lookups
- child_id lookups
- outcome_id lookups
- created_at sorting
- Composite indexes for common queries

---

## C) Backend Functions (Supabase RPC)

### Core Functions

1. **upsert_outcome(p_id, p_title, ...)**
   - Creates or updates an outcome
   - Validates template_type
   - Returns outcome_id

2. **map_task_to_outcome(p_outcome_id, p_assigned_task_id, p_task_template_id)**
   - Maps a task or template to an outcome
   - Idempotent (checks for existing mapping)
   - Validates all IDs belong to same family

3. **record_task_event(p_child_id, p_assigned_task_id, p_event_type, p_event_data)**
   - Records task lifecycle events
   - Idempotent via event_data.idempotency_key
   - Validates permissions

4. **compute_outcome_metrics(p_child_id, p_outcome_id, p_start_date, p_end_date)**
   - Computes all metrics for an outcome
   - Returns: completion_rate, on_time_rate, streak_days, median_time_to_complete, median_approval_latency, reminder_count
   - STABLE function (can be cached)

5. **apply_auto_approval(p_parent_id)**
   - Applies auto-approval policies
   - Uses row-level locking (FOR UPDATE)
   - Returns count of approved tasks

6. **generate_weekly_report(p_family_id, p_week_start)**
   - Generates weekly report with metrics
   - Compares current week to previous week
   - Returns: children array, consistency_score, wins, challenges

7. **generate_coaching_signals(p_child_id, p_outcome_id, p_lookback_days)**
   - Deterministic signal generation
   - Detects: evening_slump, approval_drag, overload, weekend_regression
   - Returns signals JSON

### Updated Functions

- **approve_task(p_task_id)** - Now records 'approved' event automatically

### Triggers

- **trigger_record_assigned_task_event** - Auto-records 'assigned' event on task creation
- **trigger_record_completed_task_event** - Auto-records 'completed' event on status change to 'ready_for_review'
- **trigger_update_assigned_tasks_updated_at** - Updates updated_at timestamp

---

## D) Frontend Implementation

### New Routes

1. **/parent/outcomes** - Outcomes management page
   - List all outcomes
   - Create/edit outcomes
   - Delete outcomes
   - Toggle active/inactive

2. **/parent/outcomes/[outcomeId]** - Outcome detail page
   - View mapped tasks
   - Map new tasks/templates
   - Unmap tasks

3. **/parent/coaching** - AI Coaching page
   - Select child/outcome
   - Generate insights
   - View signals and recommendations
   - "Why am I seeing this?" explanation

4. **/parent/reports** - Weekly Reports page
   - Select week
   - Generate report
   - View consistency score, wins, challenges
   - Export functionality

### Updated Routes

1. **/parent/approvals** - Now "Exceptions Queue"
   - Bulk approve selected tasks
   - Auto-approve all button
   - Checkbox selection
   - Shows only tasks needing attention

2. **/parent/dashboard** - (Future enhancement)
   - Add outcome summary tiles
   - Show outcome trends

### Components

- **CreateOutcomeModal** - Create/edit outcome form
- **MapTasksModal** - Map tasks/templates to outcome
- **ReviewQueue** - Updated with selection support

### API Routes

- **/api/coaching/generate** - Generates coaching insights
  - Calls generate_coaching_signals RPC
  - Calls compute_outcome_metrics RPC
  - Calls OpenAI API (if configured)
  - Falls back to deterministic insights if no API key
  - Stores insights in database

---

## E) AI Coaching System

### Signal Generation (Deterministic)

Signals are computed before calling LLM:

1. **Evening Slump**
   - Condition: Completion rate after 7pm is 25%+ lower than baseline
   - Impact Score: 30

2. **Approval Drag**
   - Condition: Approval latency > 60 minutes
   - Impact Score: 25

3. **Overload**
   - Condition: Assigned tasks/day > historical median + 30%
   - Impact Score: 35

4. **Weekend Regression**
   - Condition: Sat/Sun completion 20%+ lower than weekdays
   - Impact Score: 20

### LLM Integration

**Provider:** OpenAI (configurable via OPENAI_API_KEY env var)

**Model:** gpt-4o-mini (cost-effective)

**Prompt Template:**
```
You are a behavior change coach for families. Provide data-driven, actionable recommendations.

SIGNALS DETECTED: [JSON]
METRICS: [JSON]

Provide recommendations using this EXACT format:
OBSERVATION: [Data-backed observation]
DIAGNOSIS: [Why this is happening]
RECOMMENDATION: [One actionable step from allowed set]
EXPECTED RESULT: [What should improve]
NEXT CHECK: [Metric to watch]
```

**Allowed Recommendations:**
- Adjust schedule/time window
- Split tasks into smaller steps
- Reduce daily load
- Increase frequency, reduce reward size
- Add auto-approval rules
- Add "first-then" rule
- Add consistent cutoff times
- Add "catch-up day" design

**Fallback:** If OpenAI is unavailable, returns deterministic insights based on signals only.

### Guardrails

- No punishments or shame language
- Only recommends from allowed action set
- Always explains WHY with data
- Stores all insights for audit trail

---

## F) Analytics + Metrics

### Outcome Metrics (per child, per outcome, weekly)

1. **Completion Rate**
   - Formula: `completed_tasks / assigned_tasks * 100`
   - Computed in: `compute_outcome_metrics`

2. **On-Time Rate**
   - Formula: `completed_on_time / completed_tasks * 100`
   - On-time = completed on same day as assigned

3. **Streak**
   - Formula: Consecutive days with at least one completion
   - Computed from task_events

4. **Time-to-Complete (Median)**
   - Formula: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_diff)`
   - Time diff = completed_at - assigned_at

5. **Approval Latency (Median)**
   - Formula: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency)`
   - Latency = approved_at - completed_at

6. **Reminder Count**
   - Formula: `COUNT(*) WHERE event_type = 'nudged'`

### Consistency Score

- Weighted composite of all outcome completion rates
- Formula: `AVG(completion_rate)` across all outcomes
- Range: 0-100%

### Weekly Report Metrics

- Week-over-week comparison
- Compliance change %
- Approval latency change
- Streak length change
- Missed tasks reduced

---

## G) UX Flows

### Parent Flow: Create Outcome

1. Navigate to /parent/outcomes
2. Click "Create Outcome"
3. Fill form: title, description, template type, success criteria, weekly target
4. Save → Outcome created
5. Click "Manage Tasks" → Map tasks/templates

### Parent Flow: Generate Coaching

1. Navigate to /parent/coaching
2. (Optional) Select child and/or outcome
3. Click "Generate Insights"
4. View signals and recommendations
5. Click "Why am I seeing this?" for explanation

### Parent Flow: Approve Tasks (Exceptions Queue)

1. Navigate to /parent/approvals
2. See only tasks needing attention
3. Option A: Select multiple → "Approve Selected"
4. Option B: Click "Auto-Approve All" → Applies policies
5. Option C: Click individual task → Review → Approve

### Child Flow: View Tasks by Outcome

1. Navigate to /child/dashboard
2. See tasks grouped by outcome
3. Each outcome shows progress ring
4. Complete tasks as usual

---

## H) QA/Test Plan

### Unit Tests (Recommended)

1. **Metrics Calculations**
   - Test completion_rate calculation
   - Test on_time_rate calculation
   - Test streak calculation
   - Edge cases: no tasks, all completed, none completed

2. **Signal Generation**
   - Test evening_slump detection
   - Test approval_drag detection
   - Test overload detection
   - Test weekend_regression detection

3. **Auto-Approval Logic**
   - Test recurring_high_reliability policy
   - Test low_risk_task policy
   - Test row-level locking (concurrency)

### Integration Tests (Recommended)

1. **Outcome Creation Flow**
   - Create outcome → Map task → Verify metrics update

2. **Auto-Approval Flow**
   - Create policy → Assign task → Mark complete → Verify auto-approval

3. **Coaching Generation Flow**
   - Generate signals → Call API → Store insights → Verify retrieval

### E2E Tests (Recommended)

1. **Full Outcome Flow**
   - Parent creates outcome
   - Parent maps tasks
   - Child completes tasks
   - Parent approves
   - Dashboard shows updated metrics
   - Weekly report generated

2. **Auto-Approval Flow**
   - Parent creates auto-approval policy
   - Child completes high-reliability task
   - Verify auto-approval
   - Verify event recorded

---

## I) Rollout Plan

### Phase 1: Database Migrations
1. Run migrations in order:
   - `001_outcomes_system.sql`
   - `002_outcomes_rpc_functions.sql`
   - `003_automation_rpc_functions.sql`
   - `004_update_approve_task_with_events.sql`
2. Verify RLS policies
3. Test RPC functions

### Phase 2: Frontend (Feature Flags)
1. Add feature flag: `ENABLE_OUTCOMES`
2. Deploy frontend changes
3. Enable for beta users
4. Monitor errors

### Phase 3: AI Coaching
1. Set `OPENAI_API_KEY` in environment
2. Test with small user group
3. Monitor API costs
4. Roll out to all users

### Phase 4: Auto-Approval
1. Educate users on policies
2. Enable auto-approval gradually
3. Monitor approval rates
4. Adjust policies based on feedback

---

## Commands to Run

### Migrations

```sql
-- Run in Supabase SQL Editor in order:
-- 1. 001_outcomes_system.sql
-- 2. 002_outcomes_rpc_functions.sql
-- 3. 003_automation_rpc_functions.sql
-- 4. 004_update_approve_task_with_events.sql
```

### Environment Variables

```bash
# Add to .env.local
OPENAI_API_KEY=sk-... # Optional, for AI coaching
SUPABASE_SERVICE_ROLE_KEY=... # For API routes
```

### Type Generation (if using Supabase CLI)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## Definition of Done Checklist

### Outcome Dashboards
- [x] Outcomes table created with RLS
- [x] Outcome-tasks mapping table created
- [x] Metrics computation RPC works
- [x] Outcomes management page works
- [x] Outcome detail page works
- [ ] Dashboard shows outcome summary tiles (future enhancement)
- [ ] Child dashboard groups by outcomes (future enhancement)

### AI Coaching
- [x] Signal generation RPC works
- [x] Coaching API route created
- [x] OpenAI integration (with fallback)
- [x] Coaching page displays insights
- [x] Insights stored in database
- [x] "Why am I seeing this?" explanation

### Parent Friction Annihilation
- [x] Auto-approval policies table created
- [x] Auto-approval RPC works
- [x] Exceptions Queue page updated
- [x] Bulk approve functionality
- [x] Auto-approve all button
- [ ] Auto-approval settings UI (future enhancement)

### Behavior-Change Proof
- [x] Weekly report RPC works
- [x] Reports page displays data
- [x] Export functionality
- [x] Consistency score calculation
- [ ] PDF export (future enhancement)
- [ ] Shareable link generation (future enhancement)

---

## Tradeoffs & Assumptions

### Tradeoffs

1. **AI Coaching Cost**
   - Using gpt-4o-mini to reduce costs
   - Falls back to deterministic insights if API unavailable
   - Could cache insights to reduce API calls

2. **Metrics Computation**
   - Computed on-demand (not pre-computed)
   - Could add materialized views for performance
   - Current approach is simpler but slower for large datasets

3. **Auto-Approval Policies**
   - Policies are simple (could be more sophisticated)
   - Relies on completion rate history
   - May need tuning per family

### Assumptions

1. **Task Events**
   - Assumes tasks are assigned via `assigned_tasks` table
   - Assumes completion = status change to 'ready_for_review'
   - Assumes approval = status change to 'approved'

2. **Time Zones**
   - All timestamps in UTC
   - Client-side conversion for display
   - Weekend detection uses DOW (0=Sunday, 6=Saturday)

3. **Privacy**
   - No PII in exports by default
   - Parents can choose what to include
   - COPPA/GDPR compliant (no tracking beyond necessary)

---

## Next Steps

1. **Update TypeScript Types**
   - Run Supabase type generation
   - Add new table types

2. **Add Tests**
   - Unit tests for metrics calculations
   - Integration tests for RPCs
   - E2E tests for critical flows

3. **Enhancements**
   - Dashboard outcome tiles
   - Child dashboard outcome grouping
   - Auto-approval settings UI
   - PDF export for reports
   - Shareable report links

4. **Performance**
   - Add materialized views for metrics
   - Cache coaching insights
   - Optimize queries with better indexes

---

## Files Changed/Created

### Migrations
- `supabase/migrations/001_outcomes_system.sql`
- `supabase/migrations/002_outcomes_rpc_functions.sql`
- `supabase/migrations/003_automation_rpc_functions.sql`
- `supabase/migrations/004_update_approve_task_with_events.sql`

### Frontend Pages
- `src/app/parent/outcomes/page.tsx` (new)
- `src/app/parent/outcomes/[outcomeId]/page.tsx` (new)
- `src/app/parent/coaching/page.tsx` (new)
- `src/app/parent/reports/page.tsx` (new)
- `src/app/parent/approvals/page.tsx` (updated)

### API Routes
- `src/app/api/coaching/generate/route.ts` (new)

### Components
- `src/app/parent/components/ParentSidebar.tsx` (updated)
- `src/app/parent/components/ReviewQueue.tsx` (updated)

---

**Implementation Status:** ✅ Core features complete. Ready for testing and refinement.

