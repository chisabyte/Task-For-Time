# 30-Day Free Trial System Implementation

## Overview
Complete implementation of a 30-day free trial system with owner account override, premium feature gating, and server-side enforcement.

## Files Created/Modified

### SQL Migration
- **`supabase/migrations/010_trial_system.sql`**
  - Adds `trial_starts_at`, `trial_ends_at`, `plan`, `is_owner` columns to `profiles` table
  - Creates `upgrade_intents` table for upgrade modal
  - Sets default trial dates for existing users

### Core Logic
- **`src/lib/premium.ts`**
  - `getPremiumStatus()` - Single source of truth for premium access logic
  - `fetchPremiumStatus()` - Helper to fetch status from database
  - Owner override: `isOwner === true` → premium ALWAYS active
  - Plan logic: `pro` → active, `trial` → check dates, `free` → inactive

### Components
- **`src/components/TrialBanner.tsx`**
  - Shows trial countdown or expired message
  - Hidden for owners
  - Integrated into parent dashboard

- **`src/components/PremiumGate.tsx`**
  - Wraps premium features with access control
  - Shows lock screen if premium inactive
  - Used for: AI Coaching, Weekly Reports, Analytics

- **`src/components/UpgradeModal.tsx`**
  - Collects email for upgrade notifications
  - Saves to `upgrade_intents` table
  - No Stripe integration

### Signup/Onboarding Updates
- **`src/app/signup/page.tsx`**
  - Sets `trial_starts_at = now()`
  - Sets `trial_ends_at = now() + 30 days`
  - Sets `plan = 'trial'`, `is_owner = false`

- **`src/app/role/page.tsx`**
  - Same trial setup for role selection flow

### Premium Feature Gating
- **`src/app/parent/coaching/page.tsx`**
  - Wrapped with `<PremiumGate featureName="coaching">`

- **`src/app/parent/reports/page.tsx`**
  - Wrapped with `<PremiumGate featureName="reports">`

- **`src/app/parent/analytics/page.tsx`**
  - Wrapped with `<PremiumGate featureName="analytics">`

### UI Updates
- **`src/app/parent/dashboard/page.tsx`**
  - Added `<TrialBanner />` at top of main content

- **`src/app/parent/settings/components/AccountSection.tsx`**
  - Shows "Owner" badge next to Full Name if `is_owner === true`
  - Fetches `is_owner` from profile

### Server-Side Enforcement
- **`src/app/api/coaching/generate/route.ts`**
  - Checks premium status before processing
  - Returns 403 if premium inactive (unless owner)
  - Uses same `getPremiumStatus` logic

## Owner Override Setup

To mark an account as owner, run this SQL in Supabase:

```sql
UPDATE public.profiles
SET is_owner = true, plan = 'pro'
WHERE id = (SELECT id FROM auth.users WHERE email = 'roscoechisas@gmail.com');
```

Or by user_id:
```sql
UPDATE public.profiles
SET is_owner = true, plan = 'pro'
WHERE id = 'USER_UUID_HERE';
```

**Important:** Owner accounts:
- Always have premium access (ignores trial expiration)
- Never see trial countdown
- Show "Owner" badge in settings
- Cannot be downgraded by trial logic

## Premium Status Logic

```typescript
// Priority order:
1. If isOwner === true → premium active (ALWAYS)
2. Else if plan === 'pro' → premium active
3. Else if plan === 'trial' && now < trialEndsAt → premium active
4. Else → premium inactive
```

## Premium Features

The following features are gated:
- **AI Coaching** (`/parent/coaching`)
- **Weekly Reports** (`/parent/reports`)
- **Advanced Analytics** (`/parent/analytics`)

Core features (dashboard, tasks, approvals) remain free.

## Database Schema

### profiles table additions:
- `trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT now()`
- `trial_ends_at TIMESTAMP WITH TIME ZONE`
- `plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro'))`
- `is_owner BOOLEAN DEFAULT false`

### upgrade_intents table:
- `id uuid PRIMARY KEY`
- `user_id uuid REFERENCES auth.users(id)`
- `family_id uuid REFERENCES families(id)`
- `email text NOT NULL`
- `source text NOT NULL` (banner, coaching, reports, analytics)
- `created_at timestamptz DEFAULT now()`

## Testing Checklist

- [ ] New signup gets 30-day trial automatically
- [ ] Trial countdown shows correct days remaining
- [ ] Premium features locked after trial expires
- [ ] Owner account never expires
- [ ] Owner badge shows in settings
- [ ] Upgrade modal saves email to database
- [ ] API route blocks non-premium access
- [ ] No console or TypeScript errors
- [ ] Build passes successfully

## Next Steps (Future)

When ready to add Stripe:
1. Update `BillingSection` component
2. Add webhook handler for subscription events
3. Update `plan` field based on subscription status
4. Remove upgrade modal, replace with Stripe checkout

