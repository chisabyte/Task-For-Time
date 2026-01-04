# Task For Time - Build Habits, Not Conflict

A modern family task management application that gamifies chores and responsibilities, helping children earn screen time through completed tasks while giving parents full control and oversight.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Authentication & Authorization](#authentication--authorization)
- [User Roles](#user-roles)
- [Task Management Flow](#task-management-flow)
- [PIN System](#pin-system)
- [Real-time Updates](#real-time-updates)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## 🎯 Overview

**Task For Time** is a family-friendly task management platform that:

- **Gamifies chores** - Children earn XP and level up by completing tasks
- **Rewards with screen time** - Completed tasks add minutes to a "Time Bank"
- **Parental oversight** - Parents approve tasks, manage rewards, and track progress
- **Secure access** - PIN-protected accounts for both parents and children
- **Real-time updates** - Live synchronization across all devices

### Core Concept

Children complete assigned tasks → Parents review and approve → Children earn time bank minutes → Children redeem time for rewards

---

## ✨ Features

### For Parents

- **Dashboard Overview** - See all children's progress at a glance
- **Task Management** - Create, assign, and manage tasks
- **Task Templates** - Reusable task definitions
- **Approval Queue** - Review and approve completed tasks
- **Child Management** - Add/remove children, set PINs
- **Reward Management** - Create and manage redeemable rewards
- **Analytics** - Track family activity and progress
- **Bonus Grants** - Award extra time or XP
- **Celebration Stream** - See recent achievements

### For Children

- **Personal Dashboard** - View tasks, XP, level, and time bank
- **Task Completion** - Mark tasks as done with optional notes/photos
- **Progress Tracking** - See XP progress, level, and badges
- **Time Bank** - View available screen time
- **Reward Redemption** - Redeem earned time for rewards
- **Achievement System** - Level up and earn badges

### Security Features

- **PIN Protection** - Optional PINs for parent and child accounts
- **Rate Limiting** - PIN lockout after failed attempts
- **Row Level Security (RLS)** - Database-level access control
- **Child Mode Isolation** - Children can't access parent features
- **Session Management** - Secure session handling

---

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5.0.9
- **Date Handling**: date-fns 4.1.0

### Backend

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **API**: Supabase REST API + RPC Functions

### Development Tools

- **Linting**: ESLint 9
- **Package Manager**: npm
- **Type Checking**: TypeScript

---

## 🏗 Architecture

### Application Structure

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (React)        │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Parent Pages │  │ Child Pages  │   │
│  └──────────────┘  └──────────────┘   │
│         │                  │           │
│         └────────┬─────────┘           │
│                  │                     │
│         ┌────────▼─────────┐           │
│         │  Supabase Client │           │
│         └────────┬─────────┘           │
└───────────────────┼─────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  Supabase Auth │    │  PostgreSQL DB   │
│  (JWT Tokens)  │    │  (RLS Policies)  │
└────────────────┘    └──────────────────┘
```

### Data Flow

1. **User Authentication** → Supabase Auth → JWT Token
2. **API Requests** → Supabase Client → PostgreSQL (with RLS)
3. **Real-time Updates** → Supabase Realtime → WebSocket → UI Update
4. **Task Completion** → Status Update → Parent Notification → Approval Flow

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git (optional)

### Installation

1. **Clone the repository** (or navigate to project directory)
   ```bash
   cd web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the `web-app` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database** (see [Database Setup](#database-setup))

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 🗄 Database Setup

### Quick Setup (3 Steps)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Run the Schema**
   - Copy contents of `supabase/schema.sql` or `supabase/COMBINED_SETUP.sql`
   - Paste and execute in SQL Editor

3. **Enable Real-time** (Optional but recommended)
   - Run `supabase/enable_realtime.sql`:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE assigned_tasks;
   ALTER PUBLICATION supabase_realtime ADD TABLE children;
   ```

### Database Schema

#### Core Tables

**`profiles`**
- User authentication and role (parent/child)
- Family relationships
- PIN hashes and lockout info

**`families`**
- Family groups
- Created by parent users

**`children`**
- Child profiles
- XP, level, time bank
- Soft delete support

**`assigned_tasks`**
- Tasks assigned to specific children
- Status: `active`, `ready_for_review`, `approved`, `rejected`
- Links to task templates

**`task_templates`**
- Reusable task definitions
- Can be assigned to multiple children

**`rewards`**
- Redeemable rewards
- Cost in minutes
- Status: `available`, `redeemed`, `consumed`

**`reward_redemptions`**
- History of reward redemptions
- Links child, reward, and minutes spent

**`settings`**
- Family-level settings
- Dark mode, notifications

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access data from their family
- Children can only update their own tasks
- Parents can manage all family data
- Secure helper functions for operations

### Database Functions

**`get_user_family_id()`**
- Returns current user's family ID
- Used in RLS policies

**`approve_submission()`** (Legacy - for old submissions table)
- Approves task completion
- Awards time bank minutes and XP
- Updates child level

**`verify_parent_pin()`**
- Verifies parent PIN
- Implements rate limiting
- Returns boolean

**`verify_child_pin()`**
- Verifies child PIN
- Implements rate limiting
- Returns boolean

**`redeem_reward()`**
- Redeems a reward for a child
- Deducts time bank minutes
- Records redemption history

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Sign Up** → Create account → Select role (parent/child)
2. **Sign In** → Email/password → Supabase Auth
3. **Account Selection** (if parent with children) → Choose profile
4. **PIN Verification** (if PIN set) → Enter PIN → Access granted

### Authorization Levels

#### Parent Access
- Full access to all family data
- Can view/approve all tasks
- Can manage children, rewards, settings
- Can view analytics

#### Child Access
- Limited to own data
- Can view own tasks
- Can complete own tasks
- Can redeem own rewards
- **Cannot** access parent features

### Child Mode Isolation

When a child profile is selected (via PIN):
- Session is locked to child-only access
- `child_mode` flag set in sessionStorage
- Parent routes (`/parent/*`) are blocked
- Only `/child/*` routes accessible
- Exit returns to account selection, not parent dashboard

### PIN System

**Parent PIN**
- Optional 4-6 digit PIN
- Stored as bcrypt hash
- Rate limited: 5 attempts → 15 min lockout

**Child PIN**
- Optional 4 digit PIN
- Stored as bcrypt hash
- Rate limited: 5 attempts → requires parent reset

**PIN Verification**
- Uses Supabase RPC functions
- Tracks attempts in database
- Implements lockout mechanism

---

## 👥 User Roles

### Parent Role

**Capabilities:**
- Create and manage family
- Add/remove children
- Create tasks and templates
- Assign tasks to children
- Approve/reject task completions
- Create and manage rewards
- Grant bonus time/XP
- View analytics
- Manage family settings

**Routes:**
- `/parent/dashboard` - Main dashboard
- `/parent/approvals` - Task approval queue
- `/parent/tasks` - Task management
- `/parent/settings` - Family settings
- `/parent/analytics` - Analytics dashboard

### Child Role

**Capabilities:**
- View assigned tasks
- Complete tasks
- View own progress (XP, level, time bank)
- Redeem rewards
- View badges and achievements

**Routes:**
- `/child/dashboard` - Main dashboard
- `/child/task-complete/[taskId]` - Task completion page

**Restrictions:**
- Cannot access parent routes
- Cannot view other children's data
- Cannot approve own tasks
- Cannot modify rewards

---

## 📝 Task Management Flow

### Task Lifecycle

```
┌──────────┐
│  Active  │  ← Task assigned to child
└────┬─────┘
     │
     │ Child clicks "I did it!"
     ▼
┌──────────────────┐
│ Ready for Review │  ← Child marked as complete
└────┬─────────────┘
     │
     │ Parent reviews
     ├─────────┬─────────┐
     ▼         ▼         ▼
┌─────────┐ ┌────────┐ ┌──────────┐
│Approved │ │Rejected│ │ Discuss  │
└────┬────┘ └────────┘ └──────────┘
     │
     │ Awards time & XP
     ▼
┌──────────┐
│ Complete │  ← Task finished
└──────────┘
```

### Task Statuses

- **`active`** - Task assigned, waiting for child to complete
- **`ready_for_review`** - Child marked as done, waiting for parent approval
- **`approved`** - Parent approved, time/XP awarded
- **`rejected`** - Parent rejected (optional feature)

### Task Types

**Assigned Tasks**
- Directly assigned to a specific child
- Can be created from templates
- Customizable per assignment

**Task Templates**
- Reusable task definitions
- Can be assigned to multiple children
- Saves time for recurring tasks

---

## 🔒 PIN System

### Implementation

**Storage:**
- PINs stored as bcrypt hashes in database
- Never stored in plain text
- Separate tables: `profiles.pin_hash` (parent), `children.pin` (child)

**Verification:**
- Uses Supabase RPC functions
- Server-side verification
- Rate limiting built-in

**Rate Limiting:**
- 5 failed attempts → lockout
- Parent: 15-minute lockout
- Child: Requires parent reset
- Attempts tracked in database

### PIN Management

**Setting PIN:**
- Parents: Set in account settings
- Children: Set by parent in child management

**Resetting PIN:**
- Parents: Can reset via settings or SQL
- Children: Must be reset by parent

**Removing PIN:**
- Set PIN hash to NULL in database
- Account becomes PIN-free

### Troubleshooting PIN Lockout

**Reset via SQL:**
```sql
-- Reset parent PIN lockout
UPDATE profiles 
SET pin_attempts = 0, 
    pin_lockout_until = NULL
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Remove PIN requirement entirely
UPDATE profiles 
SET pin_hash = NULL
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

---

## 🔄 Real-time Updates

### Implementation

The app uses Supabase Realtime to automatically update dashboards when data changes.

**Enabled Tables:**
- `assigned_tasks` - Task status changes
- `children` - XP/level/time bank updates

**How It Works:**

1. **Child completes task** → Status changes to `ready_for_review`
2. **Realtime event fires** → Parent dashboard receives update
3. **Parent dashboard refreshes** → Shows new pending task
4. **Parent approves** → Status changes to `approved`
5. **Realtime event fires** → Child dashboard receives update
6. **Child dashboard refreshes** → Shows updated XP/time bank

### Setup

Enable real-time in Supabase:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE assigned_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE children;
```

### Code Example

```typescript
// Subscribe to task changes
const channel = supabase
  .channel('assigned-tasks-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'assigned_tasks'
  }, (payload) => {
    // Refresh data when task changes
    fetchData();
  })
  .subscribe();
```

---

## 📁 Project Structure

```
web-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── child/              # Child user pages
│   │   │   ├── components/     # Child-specific components
│   │   │   ├── dashboard/      # Child dashboard
│   │   │   └── task-complete/ # Task completion flow
│   │   ├── parent/             # Parent user pages
│   │   │   ├── components/     # Parent-specific components
│   │   │   ├── dashboard/      # Parent dashboard
│   │   │   ├── approvals/      # Task approval queue
│   │   │   ├── tasks/          # Task management
│   │   │   ├── settings/      # Family settings
│   │   │   └── analytics/      # Analytics dashboard
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   ├── role/               # Role selection
│   │   └── page.tsx            # Landing page
│   ├── lib/                    # Utility functions
│   │   ├── supabase.ts         # Supabase client
│   │   ├── child-session.ts    # Child mode management
│   │   └── analytics-utils.ts  # Analytics helpers
│   ├── types/                  # TypeScript types
│   │   └── supabase.ts         # Generated Supabase types
│   └── components/             # Shared components
│       └── ChildModeGuard.tsx  # Route protection
├── supabase/                   # Database files
│   ├── schema.sql              # Database schema
│   ├── COMBINED_SETUP.sql      # Complete setup script
│   ├── enable_realtime.sql     # Real-time setup
│   └── SETUP_INSTRUCTIONS.md   # Setup guide
├── public/                     # Static assets
├── .env.local                  # Environment variables (create this)
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

### Key Files

**`src/lib/supabase.ts`**
- Supabase client configuration
- Error handling utilities
- Session management

**`src/lib/child-session.ts`**
- Child mode session management
- Route protection logic
- Session state helpers

**`src/app/login/page.tsx`**
- Authentication flow
- Account selection
- PIN verification

**`src/app/parent/dashboard/page.tsx`**
- Parent dashboard
- Children overview
- Real-time updates

**`src/app/child/dashboard/page.tsx`**
- Child dashboard
- Task display
- Progress tracking

---

## 🔧 Environment Variables

Create a `.env.local` file in the `web-app` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Getting Your Keys:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Security Note:**
- The `anon` key is safe to expose in frontend code
- It's protected by Row Level Security (RLS)
- Never commit `.env.local` to version control

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Add environment variables
   - Deploy

3. **Configure Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Other Platforms

**Netlify:**
- Similar to Vercel
- Add environment variables in site settings

**Self-hosted:**
- Build: `npm run build`
- Start: `npm start`
- Requires Node.js 18+ server

### Post-Deployment Checklist

- [ ] Environment variables set
- [ ] Database schema deployed
- [ ] Real-time enabled
- [ ] RLS policies active
- [ ] Test login flow
- [ ] Test task creation
- [ ] Test real-time updates

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to Supabase"

**Solution:**
- Check `.env.local` file exists
- Verify environment variables are correct
- Check Supabase project is active
- Verify network connection

#### 2. "PIN not working / Locked out"

**Solution:**
- Run SQL to reset lockout (see [PIN System](#pin-system))
- Or remove PIN requirement entirely
- Wait 15 minutes for auto-unlock

#### 3. "Tasks not showing in parent dashboard"

**Solution:**
- Check task status is `ready_for_review`
- Verify RLS policies are correct
- Check browser console for errors
- Try manual refresh button

#### 4. "Real-time updates not working"

**Solution:**
- Verify real-time is enabled in Supabase
- Check `enable_realtime.sql` was run
- Verify WebSocket connection in browser
- Check Supabase project settings

#### 5. "Child can access parent dashboard"

**Solution:**
- Verify child mode is active
- Check `ChildModeGuard` component
- Verify sessionStorage has `child_mode: 'true'`
- Clear session and re-login

#### 6. "Build errors"

**Solution:**
- Run `npm install` to update dependencies
- Check TypeScript errors: `npm run build`
- Verify all environment variables set
- Clear `.next` folder and rebuild

### Debug Mode

Enable detailed logging:

```typescript
// In browser console
localStorage.setItem('debug', 'true');

// Check session state
import { getChildModeState } from '@/lib/child-session';
console.log(getChildModeState());
```

### Database Debugging

**Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'assigned_tasks';
```

**View user's family:**
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

**Check task statuses:**
```sql
SELECT id, title, status, child_id 
FROM assigned_tasks 
WHERE family_id = (SELECT family_id FROM profiles WHERE id = auth.uid());
```

---

## 📚 API Reference

### Supabase Client Methods

**Authentication:**
```typescript
// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

**Database Queries:**
```typescript
// Fetch tasks
const { data } = await supabase
  .from('assigned_tasks')
  .select('*')
  .eq('child_id', childId)
  .eq('status', 'ready_for_review');

// Update task
await supabase
  .from('assigned_tasks')
  .update({ status: 'approved' })
  .eq('id', taskId);
```

**RPC Functions:**
```typescript
// Verify PIN
await supabase.rpc('verify_parent_pin', {
  p_user_id: userId,
  input_pin: pin
});

// Redeem reward
await supabase.rpc('redeem_reward', {
  reward_id: rewardId,
  child_id: childId
});
```

### Custom Hooks & Utilities

**Child Session Management:**
```typescript
import { enterChildMode, exitChildMode, isInChildMode } from '@/lib/child-session';

// Enter child mode
enterChildMode(childId);

// Check if in child mode
if (isInChildMode()) {
  // Block parent routes
}

// Exit child mode
exitChildMode();
```

---

## 📊 Level & XP System

### Level Calculation

**Formula:**
```
Level = 1 + floor(XP / 100)
```

**Examples:**
- 0-99 XP = Level 1
- 100-199 XP = Level 2
- 200-299 XP = Level 3
- etc.

### XP Rewards

- **Task Completion**: +10 XP per approved task
- **Bonus Grants**: Variable (set by parent)

### Level Progression

- **Level 1**: Starter (0-99 XP)
- **Level 2**: Helper (100-199 XP)
- **Level 3**: Contributor (200-299 XP)
- **Level 4+**: Custom levels (configurable)

---

## 🎨 UI/UX Features

### Design System

- **Color Scheme**: Teal primary, with semantic colors
- **Typography**: Modern sans-serif, bold headings
- **Icons**: Material Symbols
- **Responsive**: Mobile-first design
- **Dark Mode**: Supported (via settings)

### Key Components

**Parent Dashboard:**
- Children overview cards
- Task approval queue
- Celebration stream
- Quick actions (Add Task, Grant Bonus)

**Child Dashboard:**
- Personalized greeting
- Task status cards
- Progress visualization
- Time bank display
- Reward redemption

---

## 🔮 Future Enhancements

Potential features for future versions:

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Email notifications
- [ ] Task scheduling/recurring tasks
- [ ] Photo proof uploads
- [ ] Custom badges/achievements
- [ ] Family leaderboards
- [ ] Task categories and filters
- [ ] Export analytics data
- [ ] Multi-language support

---

## 📄 License

This project is private and proprietary.

---

## 👥 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review browser console for errors
3. Check Supabase logs
4. Verify database schema is correct

---

## 🎉 Getting Started Checklist

- [ ] Install Node.js and npm
- [ ] Clone/navigate to project
- [ ] Run `npm install`
- [ ] Create `.env.local` with Supabase credentials
- [ ] Set up Supabase project
- [ ] Run database schema SQL
- [ ] Enable real-time (optional)
- [ ] Run `npm run dev`
- [ ] Create parent account
- [ ] Add children
- [ ] Create tasks
- [ ] Test task completion flow
- [ ] Test approval flow
- [ ] Test reward redemption

---

**Built with ❤️ for families**
