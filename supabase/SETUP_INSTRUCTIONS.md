# Supabase Database Setup Instructions

## Quick Setup (3 Steps)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/tdhkpvattuvffhjwfywl/sql/new

### Step 2: Copy & Run the Schema
Copy the entire contents of `schema.sql` and run it in the SQL Editor.

### Step 3: Test Your App
1. Go to http://localhost:3001/signup
2. Create a new account
3. You'll be redirected to select your role (parent/child)

---

## What the Schema Creates

### Tables:
- ✅ `profiles` - User roles (parent/child) and family relationships
- ✅ `families` - Family groups
- ✅ `children` - Child accounts with XP, levels, and time banks
- ✅ `tasks` - Tasks that can be completed for rewards
- ✅ `submissions` - Task completion submissions for approval
- ✅ `rewards` - Rewards that can be redeemed with earned time
- ✅ `reward_redemptions` - History of reward redemptions
- ✅ `settings` - Family settings (dark mode, notifications)

### Security (RLS Policies):
- ✅ Row Level Security enabled on all tables
- ✅ Users can only see data from their own family
- ✅ Children can submit tasks
- ✅ Parents can approve/reject submissions
- ✅ Secure helper functions for common operations

### Functions:
- ✅ `get_user_family_id()` - Get current user's family
- ✅ `approve_submission()` - Approve task completion and award time
- ✅ `discuss_submission()` - Request changes on a submission
- ✅ `redeem_reward()` - Redeem rewards with earned time

---

## ⚠️ Important Notes

1. **Don't run the seed.sql file** - It won't work because it requires auth.users to exist first
2. **Create users through the app** - Use the signup page to create real user accounts
3. **Environment variables are set** - Your `.env.local` file is already configured with:
   - NEXT_PUBLIC_SUPABASE_URL=https://tdhkpvattuvffhjwfywl.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=(configured)

---

## Verification

After running the schema, verify it worked:

```sql
-- Run this in Supabase SQL Editor to check tables were created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

You should see 8 tables listed.

---

## Next Steps

1. ✅ Run `schema.sql` in Supabase
2. ✅ Go to http://localhost:3001/signup
3. ✅ Create a parent account
4. ✅ Set up your family
5. ✅ Add children
6. ✅ Create tasks
7. ✅ Start using the app!

