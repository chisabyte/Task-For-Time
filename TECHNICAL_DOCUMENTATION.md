# Technical Documentation - Task For Time Application

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & System Design](#3-architecture--system-design)
4. [Directory Structure](#4-directory-structure)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Core Features & Functionality](#8-core-features--functionality)
9. [Frontend Deep Dive](#9-frontend-deep-dive)
10. [Backend Deep Dive](#10-backend-deep-dive)
11. [Data Flow](#11-data-flow)
12. [External Integrations](#12-external-integrations)
13. [Security Implementation](#13-security-implementation)
14. [Testing](#14-testing)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Performance Considerations](#16-performance-considerations)
17. [Configuration Files](#17-configuration-files)
18. [Known Issues & Technical Debt](#18-known-issues--technical-debt)
19. [Dependencies & Packages](#19-dependencies--packages)
20. [Code Patterns & Conventions](#20-code-patterns--conventions)

---

## 1. Application Overview

### Application Name
**Task For Time** - Build Habits, Not Conflict

### Application Type
**Web Application** - Single Page Application (SPA) built with Next.js App Router

### Purpose
A family task management platform that gamifies chores and responsibilities. Children earn screen time by completing tasks, which parents review and approve. The system includes XP/leveling mechanics, time bank management, and reward redemption.

### Target Users
- **Primary**: Parents managing family tasks and screen time
- **Secondary**: Children (ages 5-18) completing tasks to earn screen time

### Use Cases
1. Parents assign tasks to children
2. Children complete tasks and mark them as done
3. Parents review and approve completed tasks
4. Children earn time bank minutes and XP
5. Children redeem time bank for rewards
6. Parents track progress via analytics dashboard

### Current Deployment Status
**Development** - Running on localhost:3000, deployed to Supabase cloud database

### Application URL
- Development: `http://localhost:3000`
- Production: Not yet deployed (configured for Vercel deployment)

---

## 2. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router, SSR, routing |
| **React** | 19.2.3 | UI library, component framework |
| **React DOM** | 19.2.3 | React rendering for web |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **@tailwindcss/forms** | 0.5.11 | Form styling plugin |
| **@tailwindcss/container-queries** | 0.1.1 | Container query support |
| **date-fns** | 4.1.0 | Date manipulation and formatting |
| **Zustand** | 5.0.9 | Lightweight state management (installed but not actively used) |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.89.0 | Backend-as-a-Service (BaaS) |
| **PostgreSQL** | (via Supabase) | Relational database |
| **Supabase Auth** | (via Supabase) | Authentication service |
| **Supabase Realtime** | (via Supabase) | WebSocket-based real-time updates |
| **PostgREST** | (via Supabase) | Auto-generated REST API |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **eslint-config-next** | 16.1.1 | Next.js ESLint configuration |
| **@types/node** | 20.x | Node.js type definitions |
| **@types/react** | 19.x | React type definitions |
| **@types/react-dom** | 19.x | React DOM type definitions |
| **@tailwindcss/postcss** | 4.x | PostCSS plugin for Tailwind |

### Cloud Services

- **Supabase Cloud**: Database, Authentication, Realtime, Storage
  - Project URL: `https://tdhkpvattuvffhjwfywl.supabase.co`
  - Services Used:
    - PostgreSQL Database
    - Row Level Security (RLS)
    - JWT Authentication
    - Realtime Subscriptions
    - REST API (PostgREST)

### Third-Party Integrations

- **Google Fonts**: Inter font family, Material Symbols icons
- **Material Symbols**: Icon library (loaded via Google Fonts)

### Build Tools

- **Next.js Build System**: Built-in webpack-based bundler
- **PostCSS**: CSS processing
- **TypeScript Compiler**: Type checking and compilation

### Package Manager
**npm** (Node Package Manager)

---

## 3. Architecture & System Design

### Architecture Pattern
**Monolithic Frontend with Backend-as-a-Service (BaaS)**

The application follows a client-server architecture where:
- **Frontend**: Next.js application running in the browser
- **Backend**: Supabase (PostgreSQL + Auth + Realtime) as managed service
- **Communication**: REST API calls and WebSocket connections

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Next.js Application (React)                  │  │
│  │  ┌──────────────┐         ┌──────────────┐          │  │
│  │  │ Parent Pages │         │ Child Pages  │          │  │
│  │  │ /parent/*    │         │ /child/*     │          │  │
│  │  └──────┬───────┘         └──────┬───────┘          │  │
│  │         │                         │                  │  │
│  │  ┌──────▼─────────────────────────▼──────┐          │  │
│  │  │      Supabase Client (@supabase/js)    │          │  │
│  │  │  - Auth methods                        │          │  │
│  │  │  - Database queries                    │          │  │
│  │  │  - Realtime subscriptions              │          │  │
│  │  └──────┬─────────────────────────────────┘          │  │
│  └─────────┼────────────────────────────────────────────┘  │
└────────────┼───────────────────────────────────────────────┘
             │ HTTPS / WebSocket
             │
┌────────────▼───────────────────────────────────────────────┐
│              Supabase Cloud Platform                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │  PostgreSQL  │  │  Realtime    │    │
│  │  (JWT)       │  │  Database    │  │  (WebSocket) │    │
│  │              │  │  + RLS       │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                │                    │            │
│         └────────────────┴────────────────────┘            │
│                    PostgREST API                            │
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Flow

#### Example: Child Completes Task

1. **User Action**: Child clicks "I did it!" button on task card
2. **Frontend Handler**: `handleTaskComplete()` in `src/app/child/dashboard/page.tsx`
3. **API Call**: 
   ```typescript
   supabase.from('assigned_tasks')
     .update({ status: 'ready_for_review' })
     .eq('id', taskId)
   ```
4. **Network**: HTTPS POST request to Supabase REST API
5. **Backend Processing**:
   - PostgREST receives request
   - RLS policy checks: `Children can update their assigned task status`
   - Validates `child_id` matches authenticated user
   - Updates row in `assigned_tasks` table
6. **Database Trigger**: `trigger_validate_assigned_task_child` validates child belongs to family
7. **Realtime Event**: Supabase emits `UPDATE` event on `assigned_tasks` table
8. **Parent Dashboard**: Receives realtime event via WebSocket
9. **UI Update**: Parent dashboard automatically refreshes, shows task in "Ready for Review"

### Scalability Approach

**Current**: Single-instance Next.js app, Supabase managed database
- **Frontend**: Stateless, can scale horizontally
- **Database**: Managed by Supabase, auto-scaling
- **Limitations**: Single Next.js instance (no load balancing yet)

**Future Scalability**:
- Deploy to Vercel (automatic horizontal scaling)
- Supabase database scales automatically
- Realtime connections handled by Supabase infrastructure

### Performance Optimization Strategies

1. **Code Splitting**: Next.js automatic route-based code splitting
2. **Image Optimization**: Next.js Image component (not yet implemented)
3. **Lazy Loading**: React lazy loading for components (not yet implemented)
4. **Database Indexing**: Indexes on frequently queried columns:
   - `idx_assigned_tasks_family_id`
   - `idx_assigned_tasks_child_id`
   - `idx_assigned_tasks_status`
5. **Query Optimization**: Using `.select()` to fetch only needed columns
6. **Caching**: Browser caching of static assets (Next.js default)

### Caching Strategies

**Current Implementation**:
- **Browser Cache**: Static assets cached by Next.js
- **No Application-Level Cache**: All data fetched fresh from database
- **Session Storage**: Used for child mode state (`sessionStorage`)

**Future Opportunities**:
- React Query for API response caching
- Service Worker for offline support
- Redis for server-side caching (if moving to custom backend)

### CDN Usage

**Current**: Not using CDN
- Static assets served directly from Next.js
- Google Fonts loaded from Google's CDN
- Material Symbols loaded from Google's CDN

**Future**: Vercel deployment includes CDN automatically

---

## 4. Directory Structure

### Complete Folder Organization

```
web-app/
├── .next/                          # Next.js build output (generated)
├── node_modules/                   # npm dependencies
├── public/                         # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── child/                  # Child user routes
│   │   │   ├── components/         # Child-specific components
│   │   │   │   ├── ChildSidebar.tsx
│   │   │   │   ├── CompletionModal.tsx
│   │   │   │   ├── StatsHero.tsx
│   │   │   │   ├── TaskColumn.tsx
│   │   │   │   └── TimeAndRewardsColumn.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Child dashboard
│   │   │   └── task-complete/
│   │   │       └── [taskId]/
│   │   │           └── page.tsx    # Task completion page
│   │   ├── parent/                 # Parent user routes
│   │   │   ├── components/        # Parent-specific components
│   │   │   │   ├── AddAssignedTaskModal.tsx
│   │   │   │   ├── AddChildModal.tsx
│   │   │   │   ├── AddTaskModal.tsx
│   │   │   │   ├── AddTemplateModal.tsx
│   │   │   │   ├── ApprovalModal.tsx
│   │   │   │   ├── AssignTemplateModal.tsx
│   │   │   │   ├── CelebrationStream.tsx
│   │   │   │   ├── ChildrenOverview.tsx
│   │   │   │   ├── GrantBonusModal.tsx
│   │   │   │   ├── ParentHeader.tsx
│   │   │   │   ├── ParentSidebar.tsx
│   │   │   │   └── ReviewQueue.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx        # Analytics dashboard
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx        # Task approval queue
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Parent dashboard
│   │   │   ├── settings/
│   │   │   │   ├── components/
│   │   │   │   │   ├── AccountSection.tsx
│   │   │   │   │   ├── BillingSection.tsx
│   │   │   │   │   ├── FamilyManagementSection.tsx
│   │   │   │   │   ├── HelpSupportSection.tsx
│   │   │   │   │   ├── NotificationsSection.tsx
│   │   │   │   │   ├── PrivacySection.tsx
│   │   │   │   │   └── SettingsNavigation.tsx
│   │   │   │   └── page.tsx        # Settings page
│   │   │   └── tasks/
│   │   │       └── page.tsx        # Task management
│   │   ├── components/             # Shared landing page components
│   │   │   ├── ComparisonSection.tsx
│   │   │   ├── CTASection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   ├── FitSection.tsx
│   │   │   ├── FooterSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── PsychologySection.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   └── TrustSection.tsx
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── role/
│   │   │   └── page.tsx            # Role selection (parent/child)
│   │   ├── signup/
│   │   │   └── page.tsx            # Signup page
│   │   ├── verify/                 # Verification/test pages
│   │   │   ├── approvals/
│   │   │   ├── child-dashboard/
│   │   │   ├── parent-dashboard/
│   │   │   └── task-complete/
│   │   ├── favicon.ico
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/                 # Shared React components
│   │   └── ChildModeGuard.tsx      # Route protection component
│   ├── lib/                        # Utility libraries
│   │   ├── analytics-utils.ts      # Analytics calculation functions
│   │   ├── child-session.ts        # Child mode session management
│   │   └── supabase.ts             # Supabase client configuration
│   └── types/                      # TypeScript type definitions
│       └── supabase.ts             # Generated Supabase types
├── supabase/                       # Database files
│   ├── add_insert_policies.sql
│   ├── COMBINED_SETUP.sql          # Complete database setup
│   ├── enable_realtime.sql         # Real-time configuration
│   ├── schema.sql                  # Database schema
│   ├── seed.sql                    # Seed data (not used)
│   └── SETUP_INSTRUCTIONS.md
├── .env.local                      # Environment variables (not in repo)
├── eslint.config.mjs               # ESLint configuration
├── next.config.ts                  # Next.js configuration
├── package.json                    # npm dependencies
├── package-lock.json               # Locked dependency versions
├── postcss.config.mjs              # PostCSS configuration
├── README.md                       # User-facing documentation
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── TECHNICAL_DOCUMENTATION.md      # This file
```

### Purpose of Major Directories

**`src/app/`**: Next.js App Router pages and routes
- Each folder represents a route segment
- `page.tsx` files are the actual pages
- `layout.tsx` files wrap routes with shared layouts

**`src/app/child/`**: Child user interface
- Dashboard, task completion flows
- Child-specific components

**`src/app/parent/`**: Parent user interface
- Dashboard, approvals, analytics, settings
- Parent-specific components and modals

**`src/lib/`**: Reusable utility functions
- Supabase client setup
- Session management
- Analytics calculations

**`src/components/`**: Shared React components
- Used across multiple pages
- Route guards, common UI elements

**`supabase/`**: Database schema and migrations
- SQL files for setup
- Schema definitions
- RLS policies

### Configuration File Locations

- **Next.js Config**: `next.config.ts`
- **TypeScript Config**: `tsconfig.json`
- **Tailwind Config**: `tailwind.config.ts`
- **PostCSS Config**: `postcss.config.mjs`
- **ESLint Config**: `eslint.config.mjs`
- **Package Config**: `package.json`
- **Environment Variables**: `.env.local` (not committed)

### Environment-Specific Files

- **`.env.local`**: Local development environment variables
- **`.next/`**: Build output (generated, gitignored)
- **`node_modules/`**: Dependencies (generated, gitignored)

---

## 5. Database Schema

### Database System
**PostgreSQL** (via Supabase)

### Connection Details
- **Host**: Managed by Supabase
- **Database**: `postgres`
- **Schema**: `public`
- **Connection**: Via Supabase REST API and WebSocket

### Complete Table Schema

#### Table: `profiles`

**Purpose**: User authentication and role management

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, REFERENCES `auth.users(id)` | User ID from Supabase Auth |
| `role` | `text` | NOT NULL, CHECK IN ('parent', 'child') | User role |
| `display_name` | `text` | NOT NULL | User's display name |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Account creation timestamp |
| `pin_hash` | `text` | NULL | Bcrypt hash of parent PIN |
| `pin_salt` | `text` | NULL | Salt for PIN hashing |
| `pin_attempts` | `int` | DEFAULT 0 | Failed PIN attempt counter |
| `pin_lockout_until` | `timestamptz` | NULL | PIN lockout expiration |

**Indexes**: None (uses primary key)

**RLS Policies**:
- `Users can view profiles in their family`: SELECT using `family_id = get_user_family_id()`
- `Users can create their own profile`: INSERT with `id = auth.uid()`

#### Table: `families`

**Purpose**: Family group management

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Family ID |
| `name` | `text` | NOT NULL | Family name |
| `created_by` | `uuid` | NOT NULL, REFERENCES `auth.users(id)` | Creator user ID |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |

**Indexes**: None

**RLS Policies**:
- `Users can view their own family`: SELECT using `id = get_user_family_id()`
- `Users can create a family`: INSERT with `created_by = auth.uid()`

#### Table: `children`

**Purpose**: Child profiles with gamification data

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Child ID |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `name` | `text` | NOT NULL | Child's name |
| `avatar_url` | `text` | NULL | Avatar image URL |
| `level` | `int` | NOT NULL, DEFAULT 1 | Current level (1 + floor(XP/100)) |
| `xp` | `int` | NOT NULL, DEFAULT 0 | Experience points |
| `time_bank_minutes` | `int` | NOT NULL, DEFAULT 0 | Available screen time minutes |
| `auth_user_id` | `uuid` | NULL, REFERENCES `auth.users(id)` | Optional linked auth user |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `deleted_at` | `timestamptz` | NULL | Soft delete timestamp |
| `pin` | `text` | NULL | Bcrypt hash of child PIN |

**Indexes**: None (uses primary key)

**RLS Policies**:
- `Users can view children in their family`: SELECT using `family_id = get_user_family_id()`

**Soft Delete**: Implemented via `deleted_at` column (NULL = active, timestamp = deleted)

#### Table: `assigned_tasks`

**Purpose**: Tasks assigned to specific children

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Task ID |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `child_id` | `uuid` | NOT NULL, REFERENCES `children(id)` | Assigned child ID |
| `template_id` | `uuid` | NULL, REFERENCES `task_templates(id)` | Optional template source |
| `title` | `text` | NOT NULL | Task title |
| `description` | `text` | NULL | Task description |
| `category` | `text` | NULL | Task category |
| `reward_minutes` | `int` | NOT NULL | Minutes earned on approval |
| `requires_approval` | `boolean` | NOT NULL, DEFAULT true | Whether parent approval needed |
| `status` | `text` | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'ready_for_review', 'approved', 'rejected') | Task status |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Assignment timestamp |
| `created_by` | `uuid` | NULL, REFERENCES `auth.users(id)` | Creator user ID |

**Indexes**:
- `idx_assigned_tasks_family_id` ON `family_id`
- `idx_assigned_tasks_child_id` ON `child_id`
- `idx_assigned_tasks_status` ON `status`

**RLS Policies**:
- `Users can view assigned tasks in their family`: SELECT using `family_id = get_user_family_id()`
- `Parents can insert assigned tasks`: INSERT with parent role check
- `Parents can update assigned tasks`: UPDATE with parent role check
- `Children can update their assigned task status`: UPDATE with child ownership check

**Triggers**:
- `trigger_validate_assigned_task_child`: Validates `child_id` belongs to `family_id` before INSERT/UPDATE

#### Table: `task_templates`

**Purpose**: Reusable task definitions

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Template ID |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `title` | `text` | NOT NULL | Task title |
| `description` | `text` | NULL | Task description |
| `category` | `text` | NULL | Task category |
| `default_reward_minutes` | `int` | NOT NULL | Default reward minutes |
| `requires_approval` | `boolean` | NOT NULL, DEFAULT true | Approval requirement |
| `active` | `boolean` | NOT NULL, DEFAULT true | Template active status |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `created_by` | `uuid` | NULL, REFERENCES `auth.users(id)` | Creator user ID |

**Indexes**:
- `idx_task_templates_family_id` ON `family_id`

**RLS Policies**:
- `Users can view task templates in their family`: SELECT using `family_id = get_user_family_id()`
- `Parents can insert task templates`: INSERT with parent role check
- `Parents can update task templates`: UPDATE with parent role check
- `Parents can delete task templates`: DELETE with parent role check

#### Table: `rewards`

**Purpose**: Redeemable rewards

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Reward ID |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `title` | `text` | NOT NULL | Reward title |
| `cost_minutes` | `int` | NOT NULL | Minutes required to redeem |
| `icon` | `text` | NULL | Icon identifier |
| `status` | `text` | NOT NULL, DEFAULT 'available', CHECK IN ('available', 'redeemed', 'consumed') | Reward status |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Creation timestamp |

**Indexes**: None

**RLS Policies**:
- `Users can view rewards in their family`: SELECT using `family_id = get_user_family_id()`
- `Parents can manage rewards`: ALL operations with parent role check

#### Table: `reward_redemptions`

**Purpose**: History of reward redemptions

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Redemption ID |
| `family_id` | `uuid` | NOT NULL, REFERENCES `families(id)` | Family group ID |
| `child_id` | `uuid` | NOT NULL, REFERENCES `children(id)` | Child who redeemed |
| `reward_id` | `uuid` | NOT NULL, REFERENCES `rewards(id)` | Redeemed reward |
| `minutes_spent` | `int` | NOT NULL | Minutes deducted |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Redemption timestamp |

**Indexes**: None

**RLS Policies**:
- `Users can view redemptions in their family`: SELECT using `family_id = get_user_family_id()`

#### Table: `tasks` (Legacy)

**Purpose**: Legacy task table (not actively used, replaced by `assigned_tasks`)

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY | Task ID |
| `family_id` | `uuid` | NOT NULL | Family group ID |
| `title` | `text` | NOT NULL | Task title |
| `description` | `text` | NULL | Task description |
| `category` | `text` | NULL | Task category |
| `reward_minutes` | `int` | NOT NULL | Reward minutes |
| `requires_approval` | `boolean` | NOT NULL | Approval requirement |
| `active` | `boolean` | NOT NULL | Active status |
| `created_at` | `timestamptz` | NOT NULL | Creation timestamp |

#### Table: `submissions` (Legacy)

**Purpose**: Legacy submission table (not actively used, replaced by `assigned_tasks.status`)

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `uuid` | PRIMARY KEY | Submission ID |
| `family_id` | `uuid` | NOT NULL | Family group ID |
| `child_id` | `uuid` | NOT NULL | Child ID |
| `task_id` | `uuid` | NOT NULL | Task ID |
| `status` | `text` | NOT NULL, CHECK IN ('pending', 'approved', 'discuss') | Submission status |
| `note` | `text` | NULL | Child's note |
| `proof_image_path` | `text` | NULL | Proof image path |
| `submitted_at` | `timestamptz` | NOT NULL | Submission timestamp |
| `reviewed_at` | `timestamptz` | NULL | Review timestamp |
| `reviewed_by` | `uuid` | NULL | Reviewer user ID |

#### Table: `settings`

**Purpose**: Family-level settings

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `family_id` | `uuid` | PRIMARY KEY, REFERENCES `families(id)` | Family ID |
| `dark_mode_default` | `boolean` | NOT NULL, DEFAULT false | Default dark mode |
| `notifications_enabled` | `boolean` | NOT NULL, DEFAULT true | Notifications enabled |

**Indexes**: None (uses primary key)

**RLS Policies**:
- `Users can view settings for their family`: SELECT using `family_id = get_user_family_id()`

### Database Functions

#### Function: `get_user_family_id()`

**Purpose**: Helper function to get current user's family ID for RLS policies

**Signature**:
```sql
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
```

**Implementation**:
```sql
SELECT family_id FROM public.profiles WHERE id = auth.uid()
```

**Usage**: Used in RLS policies to filter data by family

#### Function: `approve_submission(submission_id uuid)`

**Purpose**: Approve a task submission (legacy, for `submissions` table)

**Signature**:
```sql
CREATE OR REPLACE FUNCTION public.approve_submission(submission_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
```

**Logic**:
1. Verify caller is parent
2. Get submission details
3. Verify family match
4. Get task reward minutes
5. Update submission status to 'approved'
6. Update child: `time_bank_minutes += reward`, `xp += 10`, `level = 1 + floor((xp + 10) / 100)`

**Security**: `SECURITY DEFINER` - runs with function creator's privileges

#### Function: `discuss_submission(submission_id uuid, note text)`

**Purpose**: Mark submission for discussion (legacy)

**Signature**:
```sql
CREATE OR REPLACE FUNCTION public.discuss_submission(submission_id uuid, note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
```

**Logic**:
1. Verify caller is parent
2. Update submission status to 'discuss'
3. Set note and reviewed_at

#### Function: `redeem_reward(reward_id uuid, child_id uuid)`

**Purpose**: Redeem a reward for a child

**Signature**:
```sql
CREATE OR REPLACE FUNCTION public.redeem_reward(reward_id uuid, child_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
```

**Logic**:
1. Get user's family_id
2. Verify reward exists and is available
3. Verify child exists and is not deleted
4. Check authorization (parent or child themselves)
5. Verify sufficient time bank balance
6. Atomically: Deduct minutes, insert redemption record, update reward status

**Security**: `SECURITY DEFINER` with authorization checks

#### Function: `verify_parent_pin(p_user_id uuid, input_pin text)`

**Purpose**: Verify parent PIN with rate limiting

**Signature**: (Not in schema.sql, but referenced in code)
```sql
CREATE OR REPLACE FUNCTION public.verify_parent_pin(p_user_id uuid, input_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
```

**Logic**:
1. Check if locked out (pin_lockout_until > now())
2. Get PIN hash from profiles table
3. Compare input_pin hash with stored hash
4. If correct: Reset attempts, return true
5. If incorrect: Increment attempts, set lockout if >= 5 attempts, return false

#### Function: `verify_child_pin(p_child_id uuid, input_pin text)`

**Purpose**: Verify child PIN with rate limiting

**Signature**: (Not in schema.sql, but referenced in code)
```sql
CREATE OR REPLACE FUNCTION public.verify_child_pin(p_child_id uuid, input_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
```

**Logic**: Similar to `verify_parent_pin` but for children table

### Database Triggers

#### Trigger: `trigger_validate_assigned_task_child`

**Purpose**: Validate that `child_id` belongs to `family_id` before INSERT/UPDATE

**Table**: `assigned_tasks`

**Timing**: `BEFORE INSERT OR UPDATE`

**Function**: `validate_assigned_task_child()`

**Logic**:
```sql
IF NOT EXISTS (
  SELECT 1 FROM public.children 
  WHERE id = NEW.child_id 
  AND family_id = NEW.family_id 
  AND deleted_at IS NULL
) THEN
  RAISE EXCEPTION 'child_id must belong to the same family_id and not be deleted';
END IF;
```

### Relationships

**Foreign Key Relationships**:
- `profiles.id` → `auth.users.id`
- `profiles.family_id` → `families.id`
- `families.created_by` → `auth.users.id`
- `children.family_id` → `families.id`
- `children.auth_user_id` → `auth.users.id` (optional)
- `assigned_tasks.family_id` → `families.id`
- `assigned_tasks.child_id` → `children.id`
- `assigned_tasks.template_id` → `task_templates.id` (optional)
- `assigned_tasks.created_by` → `auth.users.id` (optional)
- `task_templates.family_id` → `families.id`
- `rewards.family_id` → `families.id`
- `reward_redemptions.family_id` → `families.id`
- `reward_redemptions.child_id` → `children.id`
- `reward_redemptions.reward_id` → `rewards.id`
- `settings.family_id` → `families.id`

---

## 6. API Endpoints

### Supabase REST API Endpoints

All API endpoints are auto-generated by PostgREST from the database schema. Base URL: `https://tdhkpvattuvffhjwfywl.supabase.co/rest/v1`

#### Authentication Endpoints (Supabase Auth)

**POST** `/auth/v1/signup`
- **Purpose**: Create new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: `{ user: {...}, session: {...} }`
- **Auth**: None required
- **Used in**: `src/app/signup/page.tsx`

**POST** `/auth/v1/token?grant_type=password`
- **Purpose**: Sign in user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: `{ access_token, refresh_token, user }`
- **Auth**: None required
- **Used in**: `src/app/login/page.tsx` via `supabase.auth.signInWithPassword()`

**POST** `/auth/v1/logout`
- **Purpose**: Sign out user
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: `{}`
- **Auth**: Valid JWT token required
- **Used in**: Multiple components via `supabase.auth.signOut()`

**GET** `/auth/v1/user`
- **Purpose**: Get current authenticated user
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: `{ user: {...} }`
- **Auth**: Valid JWT token required
- **Used in**: All protected pages via `supabase.auth.getUser()`

#### Database Endpoints (PostgREST)

All database endpoints follow pattern: `/rest/v1/{table_name}`

**GET** `/rest/v1/profiles?id=eq.{user_id}`
- **Purpose**: Get user profile
- **Query Params**: `id=eq.{uuid}`, `select=*`
- **Response**: `[{ id, role, display_name, family_id, ... }]`
- **Auth**: JWT token, RLS policy enforced
- **Used in**: `src/app/login/page.tsx`, `src/app/parent/dashboard/page.tsx`

**GET** `/rest/v1/children?family_id=eq.{family_id}&deleted_at=is.null`
- **Purpose**: Get all children in family
- **Query Params**: `family_id=eq.{uuid}`, `deleted_at=is.null`, `select=*`
- **Response**: `[{ id, name, level, xp, time_bank_minutes, ... }]`
- **Auth**: JWT token, RLS policy enforced
- **Used in**: `src/app/parent/dashboard/page.tsx`, `src/app/parent/components/AddAssignedTaskModal.tsx`

**GET** `/rest/v1/assigned_tasks?child_id=eq.{child_id}&status=eq.ready_for_review`
- **Purpose**: Get tasks ready for review
- **Query Params**: `child_id=eq.{uuid}`, `status=eq.ready_for_review`, `select=*,children(*)`
- **Response**: `[{ id, title, status, children: {...}, ... }]`
- **Auth**: JWT token, RLS policy enforced
- **Used in**: `src/app/parent/approvals/page.tsx`

**POST** `/rest/v1/assigned_tasks`
- **Purpose**: Create new assigned task
- **Request Body**:
  ```json
  {
    "family_id": "uuid",
    "child_id": "uuid",
    "title": "Task title",
    "description": "Task description",
    "reward_minutes": 15,
    "status": "active"
  }
  ```
- **Response**: `[{ id, ... }]` (created row)
- **Auth**: JWT token, RLS policy: parent role required
- **Used in**: `src/app/parent/components/AddAssignedTaskModal.tsx`

**PATCH** `/rest/v1/assigned_tasks?id=eq.{task_id}`
- **Purpose**: Update task status
- **Request Body**:
  ```json
  {
    "status": "ready_for_review"
  }
  ```
- **Response**: `[{ id, ... }]` (updated row)
- **Auth**: JWT token, RLS policy: child can update own tasks, parent can update any
- **Used in**: `src/app/child/dashboard/page.tsx` (child completes), `src/app/parent/approvals/page.tsx` (parent approves)

**PATCH** `/rest/v1/children?id=eq.{child_id}`
- **Purpose**: Update child stats (XP, level, time bank)
- **Request Body**:
  ```json
  {
    "time_bank_minutes": 120,
    "xp": 50,
    "level": 2
  }
  ```
- **Response**: `[{ id, ... }]` (updated row)
- **Auth**: JWT token, RLS policy: parent role required
- **Used in**: `src/app/parent/approvals/page.tsx` (on approval)

**GET** `/rest/v1/rewards?family_id=eq.{family_id}&status=eq.available`
- **Purpose**: Get available rewards
- **Query Params**: `family_id=eq.{uuid}`, `status=eq.available`
- **Response**: `[{ id, title, cost_minutes, ... }]`
- **Auth**: JWT token, RLS policy enforced
- **Used in**: `src/app/child/components/TimeAndRewardsColumn.tsx`

**POST** `/rest/v1/rpc/redeem_reward`
- **Purpose**: Redeem a reward (RPC function)
- **Request Body**:
  ```json
  {
    "reward_id": "uuid",
    "child_id": "uuid"
  }
  ```
- **Response**: `void` (success) or error
- **Auth**: JWT token, function checks authorization
- **Used in**: `src/app/child/components/TimeAndRewardsColumn.tsx`

**POST** `/rest/v1/rpc/verify_parent_pin`
- **Purpose**: Verify parent PIN
- **Request Body**:
  ```json
  {
    "p_user_id": "uuid",
    "input_pin": "1234"
  }
  ```
- **Response**: `true` or `false`
- **Auth**: JWT token
- **Used in**: `src/app/login/page.tsx`

**POST** `/rest/v1/rpc/verify_child_pin`
- **Purpose**: Verify child PIN
- **Request Body**:
  ```json
  {
    "p_child_id": "uuid",
    "input_pin": "1234"
  }
  ```
- **Response**: `true` or `false`
- **Auth**: JWT token
- **Used in**: `src/app/login/page.tsx`

### Realtime Subscriptions

**WebSocket Connection**: `wss://tdhkpvattuvffhjwfywl.supabase.co/realtime/v1/websocket`

**Channel**: `assigned-tasks-changes`
- **Event**: `postgres_changes`
- **Table**: `assigned_tasks`
- **Event Types**: `INSERT`, `UPDATE`, `DELETE`
- **Purpose**: Real-time updates when tasks change
- **Used in**: `src/app/parent/dashboard/page.tsx`, `src/app/child/dashboard/page.tsx`

**Channel**: `child-assigned-tasks-changes`
- **Event**: `postgres_changes`
- **Table**: `assigned_tasks`
- **Purpose**: Real-time updates for child dashboard
- **Used in**: `src/app/child/dashboard/page.tsx`

### Rate Limiting

**Current**: No explicit rate limiting implemented
- Supabase has default rate limits on free tier
- PIN verification has built-in rate limiting (5 attempts → 15 min lockout)

**Future**: Should implement rate limiting for:
- API requests per user
- Login attempts
- Task creation

---

## 7. Authentication & Authorization

### Authentication Method

**JWT (JSON Web Tokens)** via Supabase Auth

### Token Storage

**Location**: `localStorage` (default Supabase behavior)
- **Key**: `sb-{project-ref}-auth-token`
- **Contains**: `access_token`, `refresh_token`, `expires_at`, `user`

**Session Persistence**: 
- Configured in `src/lib/supabase.ts`: `persistSession: true`
- Tokens persist across browser sessions
- Auto-refresh enabled: `autoRefreshToken: true`

### Token Expiration & Refresh

**Access Token**: 
- Expires: ~1 hour (managed by Supabase)
- Auto-refresh: Enabled via `autoRefreshToken: true`
- Refresh happens automatically before expiration

**Refresh Token**:
- Long-lived (managed by Supabase)
- Used to obtain new access tokens
- Invalidated on explicit sign out

**Refresh Logic**:
```typescript
// In src/lib/supabase.ts
auth: {
  autoRefreshToken: true,  // Auto-refresh before expiration
  detectSessionInUrl: true // Detect session from OAuth callbacks
}
```

### User Roles & Permissions

#### Role: `parent`

**Capabilities**:
- View all family data
- Create/update/delete children
- Create/assign tasks
- Approve/reject task completions
- Create/manage rewards
- Grant bonus time/XP
- View analytics
- Manage family settings

**Database Access**:
- Full access to family's data via RLS policies
- Can INSERT/UPDATE/DELETE on: `children`, `assigned_tasks`, `task_templates`, `rewards`
- Can SELECT from all family tables

**Route Access**:
- `/parent/*` - Full access
- `/child/*` - Can view as child (via account selection)

#### Role: `child`

**Capabilities**:
- View own tasks
- Complete own tasks (update status to `ready_for_review`)
- View own progress (XP, level, time bank)
- Redeem own rewards
- View available rewards

**Database Access**:
- Limited to own data via RLS policies
- Can UPDATE own `assigned_tasks` (status only)
- Can SELECT own `children` record
- Cannot access parent routes

**Route Access**:
- `/child/*` - Full access
- `/parent/*` - BLOCKED (redirected to `/child/dashboard`)

### Protected Routes

**Implementation**: `src/components/ChildModeGuard.tsx`

**Protection Logic**:
```typescript
// Check if in child mode
if (isInChildMode() && isParentRoute(pathname)) {
  // Block access, redirect to child dashboard
  router.replace('/child/dashboard');
}
```

**Protected Routes**:
- `/parent/*` - Requires parent role OR not in child mode
- `/child/*` - Accessible to all authenticated users

**Route Guard Usage**:
- Wrapped in parent pages: `src/app/parent/approvals/page.tsx`, `src/app/parent/analytics/page.tsx`
- Checks sessionStorage for `child_mode` flag
- Validates user role from database

### Password Hashing

**Method**: bcrypt (handled by Supabase Auth)
- **Rounds**: Managed by Supabase (default: 10)
- **Storage**: In Supabase `auth.users` table (not accessible via app)
- **Verification**: Handled by Supabase Auth service

### PIN System

**Parent PIN**:
- **Storage**: `profiles.pin_hash` (bcrypt hash)
- **Verification**: `verify_parent_pin()` RPC function
- **Rate Limiting**: 5 attempts → 15 minute lockout
- **Lockout Field**: `profiles.pin_lockout_until`

**Child PIN**:
- **Storage**: `children.pin` (bcrypt hash)
- **Verification**: `verify_child_pin()` RPC function
- **Rate Limiting**: 5 attempts → requires parent reset
- **Lockout**: Managed in RPC function

**PIN Hashing**:
- **Algorithm**: bcrypt
- **Salt**: Generated per PIN
- **Storage**: Hash + salt in database

### Third-Party Auth

**Current**: None implemented
- Only email/password authentication
- No OAuth (Google, Facebook, etc.)

**Future**: Can add via Supabase Auth providers

### Session Management

**Child Mode Isolation**:
- **Implementation**: `src/lib/child-session.ts`
- **Storage**: `sessionStorage` (not `localStorage`)
- **Keys**:
  - `child_mode`: `'true'` when active
  - `active_child_id`: Child profile ID
  - `child_mode_entered_at`: Timestamp
  - `selectedChildId`: Legacy key (backward compatibility)

**Session Lifecycle**:
1. User logs in → Supabase Auth session created
2. User selects child account → `enterChildMode(childId)` called
3. Child mode active → Parent routes blocked
4. User exits child mode → `exitChildMode()` clears sessionStorage
5. User logs out → `supabase.auth.signOut()` clears auth + sessionStorage

**Session Validation**:
- On each route navigation, `ChildModeGuard` checks session state
- Validates `child_mode` flag and `active_child_id`
- Redirects if accessing blocked routes

---

## 8. Core Features & Functionality

### Feature 1: User Registration & Onboarding

**Feature Name**: Sign Up Flow

**User Workflow**:
1. User visits `/signup`
2. Enters email and password (minimum 6 characters)
3. Confirms password
4. Submits form
5. System creates:
   - Auth user (via Supabase Auth)
   - Family record (`families` table)
   - Parent profile (`profiles` table with `role: 'parent'`)
6. Redirects to `/parent/dashboard`

**Files Involved**:
- `src/app/signup/page.tsx` - Signup form and logic
- `src/lib/supabase.ts` - Auth client

**Database Tables Used**:
- `auth.users` (Supabase managed)
- `families`
- `profiles`

**Business Logic**:
- Password must be >= 6 characters
- Passwords must match
- Family name defaults to "My Family"
- Display name defaults to email prefix (before @)

**Error Handling**:
- Displays error message on failure
- Logs error to console
- Does not redirect on error

**Edge Cases**:
- Email already exists → Supabase returns error
- Network failure → Error displayed, user can retry
- Invalid email format → Browser validation

### Feature 2: User Login & Account Selection

**Feature Name**: Login with Account Selection

**User Workflow**:
1. User visits `/login`
2. Enters email and password
3. System authenticates via Supabase Auth
4. If parent with children:
   - Shows account selection screen
   - Lists: Parent account + all children
5. User selects account:
   - If has PIN → Shows PIN entry
   - If no PIN → Directly navigates to dashboard
6. PIN verification (if required):
   - User enters 4-digit PIN
   - System verifies via RPC function
   - On success → Navigate to dashboard
   - On failure → Show error, increment attempts
7. Navigate to appropriate dashboard

**Files Involved**:
- `src/app/login/page.tsx` - Complete login flow
- `src/lib/supabase.ts` - Auth methods
- `src/lib/child-session.ts` - Child mode management

**Database Tables Used**:
- `auth.users`
- `profiles`
- `children`

**API Endpoints Called**:
- `POST /auth/v1/token` - Sign in
- `GET /rest/v1/profiles` - Get user profile
- `GET /rest/v1/children` - Get family children
- `POST /rest/v1/rpc/verify_parent_pin` - Verify PIN
- `POST /rest/v1/rpc/verify_child_pin` - Verify PIN

**Business Logic**:
- Parent with children → Account selection
- Parent without children → Direct to parent dashboard
- Child role → Direct to child dashboard
- PIN required if `pin_hash` is not NULL
- Rate limiting: 5 failed attempts → 15 min lockout

**Error Handling**:
- Invalid credentials → Error message
- PIN lockout → "Too many attempts" message
- Network error → Error message, retry option

**Edge Cases**:
- User has no profile → Redirect to `/role`
- User has profile but no family → Error (should not happen)
- Child deleted but in session → Cleared on next login

### Feature 3: Task Assignment

**Feature Name**: Assign Task to Child

**User Workflow** (Parent):
1. Parent clicks "Add Task" button
2. Modal opens (`AddAssignedTaskModal`)
3. Parent selects child (or auto-selected if only one)
4. Enters task details:
   - Title (required)
   - Description (optional)
   - Category (dropdown)
   - Reward minutes (default: 15)
   - Requires approval (default: true)
5. Submits form
6. System creates `assigned_tasks` record with `status: 'active'`
7. Modal closes, dashboard refreshes
8. Child sees task in their dashboard

**Files Involved**:
- `src/app/parent/components/AddAssignedTaskModal.tsx` - Task creation modal
- `src/app/parent/dashboard/page.tsx` - Parent dashboard (triggers modal)

**Database Tables Used**:
- `assigned_tasks` - New task record
- `children` - Validate child exists

**API Endpoints Called**:
- `GET /rest/v1/children` - Fetch children list
- `POST /rest/v1/assigned_tasks` - Create task

**Business Logic**:
- Title is required
- Reward minutes must be positive integer
- Child must belong to parent's family (enforced by RLS)
- Status defaults to `'active'`
- `created_by` set to current user ID

**Validation Rules**:
- Title: Required, non-empty string
- Reward minutes: Positive integer, typically 5-60
- Child selection: Required if multiple children

**Error Handling**:
- RLS violation → Error: "Permission denied"
- Invalid child_id → Database trigger prevents insert
- Network error → Error message, form remains open

**Edge Cases**:
- Only one child → Auto-selected
- Child deleted during form fill → Error on submit
- Family has no children → Modal shows empty state

### Feature 4: Task Completion

**Feature Name**: Child Marks Task as Complete

**User Workflow** (Child):
1. Child views dashboard with active tasks
2. Clicks "I did it!" button on task card
3. System updates `assigned_tasks.status` to `'ready_for_review'`
4. Task moves from "Active Tasks" to "Ready for Review" section
5. Real-time event fires → Parent dashboard updates
6. Child sees confirmation (redirects to completion page)

**Files Involved**:
- `src/app/child/dashboard/page.tsx` - Task display and completion handler
- `src/app/child/task-complete/[taskId]/page.tsx` - Completion confirmation page

**Database Tables Used**:
- `assigned_tasks` - Update status

**API Endpoints Called**:
- `PATCH /rest/v1/assigned_tasks?id=eq.{taskId}` - Update status

**Business Logic**:
- Only child who owns task can update (RLS policy)
- Status changes: `'active'` → `'ready_for_review'`
- Cannot change other fields (only status)
- Task must be in `'active'` status to complete

**Validation Rules**:
- Task must belong to current child
- Task must be in `'active'` status
- Child must be authenticated

**Error Handling**:
- Permission denied → Alert, task remains active
- Task not found → Error message
- Network error → Alert, user can retry

**Edge Cases**:
- Task already completed → No action (button disabled)
- Task deleted by parent → Error on update
- Multiple rapid clicks → Only first update succeeds

### Feature 5: Task Approval

**Feature Name**: Parent Approves Completed Task

**User Workflow** (Parent):
1. Parent views approvals page (`/parent/approvals`)
2. Sees list of tasks with `status: 'ready_for_review'`
3. Clicks on task to review
4. Modal opens showing:
   - Child name and avatar
   - Task title and description
   - Submission time
   - Reward amount
   - Child's current time bank
5. Parent clicks "Approve & Celebrate!"
6. System:
   - Updates task status to `'approved'`
   - Adds reward minutes to child's time bank
   - Adds 10 XP to child
   - Recalculates child's level: `1 + floor(xp / 100)`
7. Task removed from approval queue
8. Real-time event fires → Child dashboard updates

**Files Involved**:
- `src/app/parent/approvals/page.tsx` - Approval queue page
- `src/app/parent/components/ApprovalModal.tsx` - Approval modal
- `src/app/parent/components/ReviewQueue.tsx` - Task list component

**Database Tables Used**:
- `assigned_tasks` - Update status
- `children` - Update time_bank_minutes, xp, level

**API Endpoints Called**:
- `GET /rest/v1/assigned_tasks?status=eq.ready_for_review` - Fetch pending tasks
- `PATCH /rest/v1/assigned_tasks?id=eq.{taskId}` - Update to approved
- `PATCH /rest/v1/children?id=eq.{childId}` - Update stats

**Business Logic**:
- Only parent can approve (RLS policy)
- XP gain: +10 per approved task
- Level calculation: `level = 1 + floor(xp / 100)`
- Time bank: `time_bank_minutes += reward_minutes`
- Updates are atomic (single transaction would be ideal, but using sequential updates)

**Validation Rules**:
- Parent must belong to same family as child
- Task must be in `'ready_for_review'` status
- Reward minutes must be positive

**Error Handling**:
- Permission denied → Alert, task remains pending
- Child not found → Error message
- Update failure → Alert, user can retry
- Partial update (task approved but stats not updated) → Inconsistent state (handled by showing error)

**Edge Cases**:
- Task already approved → No action (should not appear in queue)
- Child deleted → Error on stats update
- Concurrent approvals → Last write wins (race condition possible)

### Feature 6: Reward Redemption

**Feature Name**: Child Redeems Reward

**User Workflow** (Child):
1. Child views dashboard → "MY TIME BANK" section
2. Sees available rewards list
3. Clicks "Use Now" on a reward
4. System checks:
   - Reward is available
   - Child has sufficient time bank balance
5. If sufficient:
   - Deducts `cost_minutes` from time bank
   - Creates `reward_redemptions` record
   - Updates reward status to `'redeemed'`
6. Reward removed from available list
7. Time bank balance updates

**Files Involved**:
- `src/app/child/components/TimeAndRewardsColumn.tsx` - Rewards display and redemption
- `src/lib/supabase.ts` - RPC call

**Database Tables Used**:
- `rewards` - Check availability, update status
- `children` - Check balance, deduct minutes
- `reward_redemptions` - Record redemption

**API Endpoints Called**:
- `GET /rest/v1/rewards?family_id=eq.{familyId}&status=eq.available` - Fetch rewards
- `POST /rest/v1/rpc/redeem_reward` - Redeem reward (atomic operation)

**Business Logic**:
- Reward must be `status: 'available'`
- Child must have `time_bank_minutes >= cost_minutes`
- Redemption is atomic (handled by RPC function)
- Reward status changes to `'redeemed'`

**Validation Rules**:
- Sufficient balance check (in RPC function)
- Reward must belong to child's family
- Reward must be available (not already redeemed)

**Error Handling**:
- Insufficient balance → Error: "Sufficient minutes not available"
- Reward not found → Error: "Reward not found or not available"
- Network error → Alert, user can retry

**Edge Cases**:
- Balance changes between check and redemption → RPC function prevents double-spend
- Reward deleted → Error on redemption
- Concurrent redemptions → Database constraint prevents duplicate

### Feature 7: Analytics Dashboard

**Feature Name**: Parent Analytics View

**User Workflow** (Parent):
1. Parent navigates to `/parent/analytics`
2. System fetches:
   - All children in family
   - All assigned tasks in selected time range
   - Task completion data
3. Calculates metrics:
   - Tasks completed (current vs previous period)
   - Minutes earned (current vs previous period)
   - Completion rate
   - Consistency score (days active in last 7 days)
   - Momentum (last 7 days vs prior 7 days)
4. Displays:
   - KPI cards with trends
   - Daily activity chart
   - Child leaderboard
   - Insights and recommendations
5. Parent can change time range (this week, last week, last 30 days, custom)

**Files Involved**:
- `src/app/parent/analytics/page.tsx` - Main analytics page
- `src/lib/analytics-utils.ts` - Calculation functions

**Database Tables Used**:
- `children` - Child data
- `assigned_tasks` - Task completion data
- `reward_redemptions` - Redemption history

**API Endpoints Called**:
- `GET /rest/v1/children?family_id=eq.{familyId}` - Fetch children
- `GET /rest/v1/assigned_tasks?family_id=eq.{familyId}` - Fetch tasks
- `GET /rest/v1/reward_redemptions?family_id=eq.{familyId}` - Fetch redemptions

**Business Logic**:
- **Completion Rate**: `(approvedCount / assignedCount) * 100`
- **Consistency Band**: 
  - Green: 5-7 days active
  - Yellow: 2-4 days active
  - Red: 0-1 days active
- **Momentum**: `last7DaysCompletions - prior7DaysCompletions`
  - Improving: delta > 0
  - Stable: delta = 0
  - Declining: delta < 0
- **Level Calculation**: `1 + floor(xp / 100)`

**Validation Rules**:
- Time range must be valid (start < end)
- Calculations handle division by zero (returns 0)

**Error Handling**:
- Data fetch failure → Error message, empty state
- Invalid date range → Validation error
- Missing data → Graceful degradation (shows 0)

**Edge Cases**:
- No tasks in period → Shows 0% completion rate
- Child with no activity → Shows in leaderboard with 0 metrics
- Date range spans multiple months → Handled correctly

---

## 9. Frontend Deep Dive

### Component Structure & Hierarchy

**Root Layout**: `src/app/layout.tsx`
- Wraps all pages
- Loads fonts (Inter, Material Symbols)
- Sets global styles
- No authentication check (handled per-page)

**Page Components** (Next.js App Router):
- Each folder in `src/app/` represents a route
- `page.tsx` files are the actual pages
- `layout.tsx` files wrap routes (not used in this app)

**Component Hierarchy Example** (Parent Dashboard):
```
ParentDashboardPage (src/app/parent/dashboard/page.tsx)
├── ParentSidebar (src/app/parent/components/ParentSidebar.tsx)
└── Main Content
    ├── ChildrenOverview (src/app/parent/components/ChildrenOverview.tsx)
    │   └── ChildCard (rendered for each child)
    └── CelebrationStream (src/app/parent/components/CelebrationStream.tsx)
```

**Shared Components**:
- `ChildModeGuard` - Route protection wrapper
- Landing page sections (StatsSection, FAQSection, etc.)

### State Management Approach

**Primary**: React `useState` and `useEffect` hooks
- Local component state for UI
- No global state management library actively used

**Zustand**: Installed (`zustand@5.0.9`) but **not currently used**
- Available for future global state needs
- Could be used for: user session, theme preferences, notifications

**Session Storage**: Used for child mode state
- `sessionStorage` (not `localStorage`)
- Managed by `src/lib/child-session.ts`
- Keys: `child_mode`, `active_child_id`, `child_mode_entered_at`

**State Patterns**:
- **Server State**: Fetched from Supabase, stored in component state
- **Form State**: Controlled components with `useState`
- **Modal State**: Boolean flags (`isOpen`, `isLoading`)

### Routing Implementation

**Framework**: Next.js App Router (file-based routing)

**Route Structure**:
```
/                          → Landing page (src/app/page.tsx)
/login                     → Login page
/signup                    → Signup page
/role                      → Role selection
/parent/dashboard          → Parent dashboard
/parent/approvals          → Task approvals
/parent/analytics          → Analytics
/parent/tasks              → Task management
/parent/settings           → Settings
/child/dashboard           → Child dashboard
/child/task-complete/[id]  → Task completion page
```

**Dynamic Routes**:
- `[taskId]` - Dynamic task ID parameter
- Accessed via `useParams()` hook

**Navigation**:
- `next/navigation` - `useRouter()`, `usePathname()`
- Programmatic: `router.push('/path')`
- Links: `<Link href="/path">` component

**Route Protection**:
- `ChildModeGuard` component wraps protected routes
- Checks `sessionStorage` for child mode
- Redirects if accessing blocked routes

### Form Handling & Validation

**Approach**: Controlled components with React state

**Example** (Login Form):
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

**Validation**:
- **Client-side**: HTML5 validation (`required`, `type="email"`)
- **Custom**: JavaScript validation in submit handlers
- **Server-side**: Database constraints and RLS policies

**Form Libraries**: None used (native HTML forms)

**PIN Input**: Custom 4-digit input
- 4 separate input fields
- Auto-focus next field on input
- Backspace moves to previous field
- Located in: `src/app/login/page.tsx`

### API Communication Patterns

**Client**: `@supabase/supabase-js` v2.89.0

**Pattern**: Direct Supabase client calls in components
```typescript
const { data, error } = await supabase
  .from('assigned_tasks')
  .select('*')
  .eq('child_id', childId);
```

**Error Handling**:
- Try-catch blocks around async operations
- Error messages displayed to user
- Console logging for debugging

**Loading States**:
- `loading` state variable
- Spinner components during fetch
- Disabled buttons during submission

**Real-time Subscriptions**:
```typescript
const channel = supabase
  .channel('assigned-tasks-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_tasks' }, (payload) => {
    fetchData(); // Refresh data
  })
  .subscribe();
```

### UI Component Library

**None Used** - Custom components built with Tailwind CSS

**Icons**: Material Symbols (via Google Fonts)
- Loaded in `src/app/layout.tsx`
- Usage: `<span className="material-symbols-outlined">icon_name</span>`

**No External UI Library**: No Material-UI, Ant Design, or similar

### Styling Approach

**Framework**: Tailwind CSS v4

**Configuration**: `tailwind.config.ts`
- Custom colors: `primary`, `primary-dark`, `background-light`, etc.
- Custom fonts: Inter (display, sans)
- Custom border radius values
- Custom shadows

**Global Styles**: `src/app/globals.css`
- Tailwind imports
- CSS custom properties (theme variables)
- Custom utility classes

**Responsive Design**:
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:` (Tailwind defaults)
- Hidden/shown elements based on screen size

**Dark Mode**:
- Configured: `darkMode: "class"` in Tailwind config
- Toggle via `dark` class on `<html>` element
- Not yet implemented in UI (infrastructure ready)

### Responsive Design Breakpoints

**Tailwind Defaults**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Usage Examples**:
- Sidebar: Hidden on mobile (`hidden md:flex`)
- Grid columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Text sizes: `text-2xl md:text-3xl lg:text-4xl`

### Browser Compatibility Targets

**Not Explicitly Defined** - Uses Next.js defaults:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2017 target (from `tsconfig.json`)
- No IE11 support

**Polyfills**: Handled by Next.js automatically

---

## 10. Backend Deep Dive

### Request Handling Flow

**Architecture**: Serverless (Supabase handles all backend)

**Flow**:
1. Client makes request → Supabase REST API
2. PostgREST receives request
3. JWT token validated
4. RLS policy evaluated
5. SQL query executed
6. Response returned to client

**No Custom Backend**: All logic in database (functions, triggers, RLS)

### Middleware Stack

**Supabase Middleware** (managed):
1. Authentication middleware (validates JWT)
2. RLS policy evaluation
3. Query execution
4. Response formatting

**Application Middleware**: None (client-side only)

### Validation & Sanitization

**Database Level**:
- **Constraints**: NOT NULL, CHECK, FOREIGN KEY
- **Data Types**: Enforced by PostgreSQL
- **Triggers**: `validate_assigned_task_child` validates relationships

**Application Level**:
- **TypeScript**: Type checking at compile time
- **Form Validation**: HTML5 + custom JavaScript
- **No Input Sanitization**: Relies on Supabase/PostgreSQL (parameterized queries prevent SQL injection)

### Business Logic Organization

**Location**: Database functions (RPC) and client-side

**Database Functions**:
- `approve_submission()` - Task approval logic
- `redeem_reward()` - Reward redemption logic
- `verify_parent_pin()` - PIN verification
- `verify_child_pin()` - PIN verification

**Client-Side Logic**:
- Form validation
- UI state management
- Data transformation for display
- Analytics calculations (`src/lib/analytics-utils.ts`)

### Error Handling Patterns

**Database Errors**:
- Caught in try-catch blocks
- Error messages displayed to user
- Console logging for debugging

**Error Types**:
- **RLS Violations**: "Permission denied" → User sees error
- **Constraint Violations**: Database error → User sees error
- **Network Errors**: Fetch failure → User sees error, can retry

**Error Display**:
- Inline error messages in forms
- Alert dialogs for critical errors
- Console logging for developers

### Logging Implementation

**Client-Side Logging**:
- `console.log()` for debugging
- `console.error()` for errors
- No structured logging system

**Server-Side Logging**:
- Managed by Supabase
- Accessible via Supabase dashboard
- No custom logging implemented

### Background Job Processing

**None Implemented**
- All operations are synchronous
- No queue system
- No scheduled tasks

**Future Opportunities**:
- Email notifications (background job)
- Daily/weekly reports (scheduled task)
- Cleanup of old data (scheduled task)

### Scheduled Tasks / Cron Jobs

**None Implemented**

**Potential Use Cases**:
- Daily task reminders
- Weekly progress reports
- Cleanup of soft-deleted records
- PIN lockout expiration

---

## 11. Data Flow

### User Registration Flow

1. **User Action**: Submits signup form (`/signup`)
2. **Frontend**: `src/app/signup/page.tsx` → `handleSignup()`
3. **API Call**: `supabase.auth.signUp({ email, password })`
4. **Supabase Auth**: Creates user in `auth.users` table
5. **Frontend**: Creates family record
   ```typescript
   supabase.from('families').insert({ name: 'My Family', created_by: user.id })
   ```
6. **Frontend**: Creates profile record
   ```typescript
   supabase.from('profiles').insert({ id: user.id, role: 'parent', family_id: family.id })
   ```
7. **Database**: RLS policies validate inserts
8. **Response**: Success → Redirect to `/parent/dashboard`

**Data Created**:
- `auth.users` record (Supabase managed)
- `families` record
- `profiles` record

### Login Flow

1. **User Action**: Submits login form (`/login`)
2. **Frontend**: `src/app/login/page.tsx` → `handleLogin()`
3. **API Call**: `supabase.auth.signInWithPassword({ email, password })`
4. **Supabase Auth**: Validates credentials, returns JWT
5. **Frontend**: Stores JWT in localStorage
6. **Frontend**: Fetches user profile
   ```typescript
   supabase.from('profiles').select('*').eq('id', user.id).single()
   ```
7. **Logic Branch**:
   - If parent with children → Show account selection
   - If parent without children → Check PIN → Dashboard
   - If child → Check PIN → Dashboard
8. **PIN Verification** (if required):
   - `supabase.rpc('verify_parent_pin', { p_user_id, input_pin })`
   - Returns `true`/`false`
   - Rate limiting enforced
9. **Child Mode** (if child selected):
   - `enterChildMode(childId)` → Sets sessionStorage flags
10. **Navigation**: Redirect to appropriate dashboard

**Data Accessed**:
- `auth.users` (Supabase Auth)
- `profiles`
- `children` (if parent)

### Task Creation Flow (CRUD - Create)

1. **User Action**: Parent clicks "Add Task" → Opens modal
2. **Frontend**: `AddAssignedTaskModal.tsx` → Fetches children list
3. **API Call**: `GET /rest/v1/children?family_id=eq.{familyId}`
4. **User Action**: Fills form, selects child, submits
5. **Frontend**: `handleSubmit()` → Validates form
6. **API Call**: 
   ```typescript
   supabase.from('assigned_tasks').insert({
     family_id, child_id, title, description, reward_minutes, status: 'active'
   })
   ```
7. **Database**: 
   - RLS policy checks: Parent role required
   - Trigger validates: `child_id` belongs to `family_id`
   - Insert succeeds
8. **Realtime Event**: Supabase emits `INSERT` event
9. **Child Dashboard**: Receives realtime event → Refreshes → Shows new task
10. **Response**: Success → Modal closes, parent dashboard refreshes

**Data Created**:
- `assigned_tasks` record

### Task Completion Flow (CRUD - Update)

1. **User Action**: Child clicks "I did it!" on task card
2. **Frontend**: `src/app/child/dashboard/page.tsx` → `handleTaskComplete(taskId)`
3. **API Call**:
   ```typescript
   supabase.from('assigned_tasks')
     .update({ status: 'ready_for_review' })
     .eq('id', taskId)
     .eq('child_id', child.id)
   ```
4. **Database**:
   - RLS policy checks: Child owns task
   - Update succeeds
5. **Realtime Event**: Supabase emits `UPDATE` event
6. **Parent Dashboard**: Receives event → Refreshes → Shows task in "Ready for Review"
7. **Response**: Success → Redirect to `/child/task-complete/[taskId]`

**Data Updated**:
- `assigned_tasks.status`: `'active'` → `'ready_for_review'`

### Task Approval Flow (CRUD - Update)

1. **User Action**: Parent clicks "Approve & Celebrate!" in approval modal
2. **Frontend**: `src/app/parent/approvals/page.tsx` → `handleApprove(taskId)`
3. **API Call 1**: Update task status
   ```typescript
   supabase.from('assigned_tasks')
     .update({ status: 'approved' })
     .eq('id', taskId)
   ```
4. **API Call 2**: Fetch current child stats
   ```typescript
   supabase.from('children')
     .select('time_bank_minutes, xp, level')
     .eq('id', childId)
     .single()
   ```
5. **Frontend**: Calculates new values
   - `newXp = currentXp + 10`
   - `newLevel = 1 + floor(newXp / 100)`
   - `newTimeBank = currentTimeBank + rewardMinutes`
6. **API Call 3**: Update child stats
   ```typescript
   supabase.from('children')
     .update({ time_bank_minutes: newTimeBank, xp: newXp, level: newLevel })
     .eq('id', childId)
   ```
7. **Realtime Events**: Supabase emits `UPDATE` events
8. **Child Dashboard**: Receives event → Refreshes → Shows updated XP/level/time bank
9. **Response**: Success → Task removed from approval queue

**Data Updated**:
- `assigned_tasks.status`: `'ready_for_review'` → `'approved'`
- `children.time_bank_minutes`: Increased by `reward_minutes`
- `children.xp`: Increased by 10
- `children.level`: Recalculated

**Note**: This is not atomic (3 separate updates). Race condition possible if concurrent approvals.

### Real-time Features

**Implementation**: Supabase Realtime (WebSocket)

**Subscriptions**:
- `assigned_tasks` table changes
- `children` table changes (for XP/level updates)

**Flow**:
1. Component mounts → Creates Supabase channel
2. Subscribes to `postgres_changes` events
3. On event → Calls `fetchData()` to refresh
4. Component unmounts → Removes channel

**Used In**:
- `src/app/parent/dashboard/page.tsx`
- `src/app/child/dashboard/page.tsx`

---

## 12. External Integrations

### Supabase

**Service**: Backend-as-a-Service (BaaS)

**Purpose**: Database, Authentication, Real-time

**API Endpoints Used**:
- `https://tdhkpvattuvffhjwfywl.supabase.co/rest/v1/*` - REST API
- `https://tdhkpvattuvffhjwfyjwfywl.supabase.co/realtime/v1/websocket` - WebSocket
- `https://tdhkpvattuvffhjwfywl.supabase.co/auth/v1/*` - Auth API

**Authentication Method**: JWT tokens in Authorization header

**Data Sent**:
- User credentials (signup/login)
- Database queries (SELECT, INSERT, UPDATE)
- RPC function calls

**Data Received**:
- JWT tokens
- Database query results
- Real-time event payloads

**Webhook Handling**: None implemented

**Fallback/Error Handling**:
- Network errors → User sees error message
- Auth errors → Redirect to login
- RLS violations → Permission denied error

### Google Fonts

**Service**: Font hosting

**Purpose**: Load Inter font and Material Symbols icons

**API Endpoints Used**:
- `https://fonts.googleapis.com/css2?family=Inter:...`
- `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:...`

**Authentication Method**: None (public CDN)

**Data Sent**: None (GET requests only)

**Data Received**: CSS files with font definitions

**Fallback**: Browser default fonts if load fails

---

## 13. Security Implementation

### Input Validation & Sanitization

**Client-Side**:
- HTML5 validation (`required`, `type="email"`, `minLength`)
- Custom JavaScript validation in form handlers
- TypeScript type checking

**Server-Side**:
- PostgreSQL data type enforcement
- CHECK constraints (e.g., `status IN ('active', 'ready_for_review', ...)`)
- NOT NULL constraints
- Foreign key constraints

**No Explicit Sanitization**: Relies on parameterized queries (Supabase handles this)

### SQL Injection Prevention

**Method**: Parameterized queries via Supabase client

**Implementation**:
```typescript
// Safe - parameterized
supabase.from('assigned_tasks').select('*').eq('id', taskId)

// Supabase client automatically parameterizes all queries
// No raw SQL strings with user input
```

**Database Functions**: Use `SECURITY DEFINER` with input validation

### XSS Prevention

**Method**: React's automatic escaping

**Implementation**:
- React escapes all text content by default
- No `dangerouslySetInnerHTML` used
- User input displayed as text, not HTML

**Vulnerable Areas**: None identified (all user input is text)

### CSRF Protection

**Current**: Not explicitly implemented
- Supabase handles CSRF for auth endpoints
- Database operations require valid JWT (CSRF not applicable)

**Future**: Should add CSRF tokens for state-changing operations

### Rate Limiting

**PIN Verification**:
- 5 failed attempts → 15 minute lockout (parent)
- 5 failed attempts → Requires parent reset (child)
- Tracked in database: `pin_attempts`, `pin_lockout_until`

**API Requests**: 
- No application-level rate limiting
- Supabase has default rate limits on free tier

**Future**: Should implement rate limiting for:
- Login attempts
- Task creation
- API requests per user

### Secrets Management

**Environment Variables**: `.env.local` file (not committed)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Security**:
- `.env.local` in `.gitignore`
- Public keys are safe to expose (protected by RLS)
- No server-side secrets (all client-side)

**Database Credentials**: Managed by Supabase (not accessible to app)

### HTTPS/SSL Implementation

**Current**: Development uses HTTP (localhost)
**Production**: Should use HTTPS (Vercel provides automatically)

**Supabase**: All API calls use HTTPS
- `https://tdhkpvattuvffhjwfywl.supabase.co`

### CORS Configuration

**Managed by Supabase**: CORS headers set by Supabase
- Allows requests from configured origins
- Configured in Supabase dashboard

**Current**: Likely allows all origins (development)

### Security Headers

**Not Explicitly Set**: Next.js provides some defaults
- Should add security headers in production:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Strict-Transport-Security`

### Data Encryption

**At Rest**: Managed by Supabase (PostgreSQL encryption)
**In Transit**: HTTPS for all API calls
**Sensitive Data**:
- Passwords: Hashed by Supabase Auth (bcrypt)
- PINs: Hashed with bcrypt in database
- JWT tokens: Signed, not encrypted

---

## 14. Testing

### Testing Frameworks Used

**Current**: None implemented
- No test files found
- No testing framework configured

### Test Coverage

**Current**: 0% (no tests)

### Types of Tests

**None Currently**:
- No unit tests
- No integration tests
- No E2E tests

### Critical Test Files

**None Exist**

### Mocking Strategies

**Not Applicable** (no tests)

### Future Testing Recommendations

**Unit Tests**:
- `src/lib/analytics-utils.ts` - Calculation functions
- `src/lib/child-session.ts` - Session management
- Component logic (form validation, state management)

**Integration Tests**:
- API calls to Supabase
- Database operations
- Authentication flows

**E2E Tests**:
- Complete user workflows (signup → task creation → completion → approval)
- Cross-browser testing

**Testing Frameworks to Consider**:
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing

---

## 15. Deployment & DevOps

### Hosting Platform

**Current**: Local development only
**Target**: Vercel (Next.js recommended platform)

### Deployment Process

**Current**: Manual
1. Run `npm run build`
2. Test build locally
3. Deploy to Vercel (manual push)

**Future CI/CD**: Not yet configured
- Should set up GitHub Actions or Vercel Git integration
- Automatic deployment on push to main branch

### Environment Variables

**Required Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional Variables**: None currently

**Location**:
- Development: `.env.local` (not committed)
- Production: Set in Vercel dashboard

### Build Process

**Command**: `npm run build`

**Steps**:
1. TypeScript compilation
2. Next.js optimization
3. Code splitting
4. Asset optimization
5. Output to `.next/` directory

**Build Output**: Static HTML + JavaScript bundles

### Docker Usage

**Not Used**: No Dockerfile or docker-compose.yml

### Load Balancing

**Not Applicable**: Single Next.js instance
**Future**: Vercel handles load balancing automatically

### Auto-Scaling Configuration

**Not Configured**: Manual scaling
**Future**: Vercel auto-scales based on traffic

### Backup Strategy

**Database**: Managed by Supabase
- Automatic backups (frequency depends on Supabase plan)
- Point-in-time recovery available

**Application Code**: Version controlled in Git
- No separate backup needed

**User Data**: Stored in Supabase database (backed up automatically)

### Monitoring & Logging Tools

**Current**: 
- Browser console logging (`console.log`, `console.error`)
- Supabase dashboard logs

**Future Recommendations**:
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **LogRocket** or **Datadog** - Application monitoring

---

## 16. Performance Considerations

### Database Query Optimization

**Indexes Created**:
- `idx_assigned_tasks_family_id` - Fast family filtering
- `idx_assigned_tasks_child_id` - Fast child filtering
- `idx_assigned_tasks_status` - Fast status filtering
- `idx_task_templates_family_id` - Fast template lookup

**Query Patterns**:
- Use `.select()` to fetch only needed columns
- Use `.eq()` for indexed columns
- Use `.limit()` when possible

**N+1 Query Problem**: Not fully addressed
- Some components fetch data in loops
- Could be optimized with batch queries

### Lazy Loading Implementation

**Current**: None implemented
- All components load immediately
- No code splitting beyond Next.js defaults

**Future Opportunities**:
- Lazy load modals
- Lazy load analytics charts
- Lazy load heavy components

### Code Splitting

**Automatic**: Next.js route-based code splitting
- Each route is a separate bundle
- Shared code extracted to common chunks

**Manual**: None implemented
- Could use `React.lazy()` for component-level splitting

### Asset Optimization

**Images**: Not yet optimized
- No Next.js Image component usage
- Should implement for avatars and proof images

**Fonts**: Optimized via Google Fonts CDN
- Preconnect headers in layout
- Font display: swap

**CSS**: Tailwind CSS purged in production
- Only used classes included in bundle

### Bundle Size & Optimization

**Current Bundle**: Not measured
- Should analyze with `@next/bundle-analyzer`

**Optimization Strategies**:
- Tree shaking (automatic with Next.js)
- Minification (automatic in production)
- Compression (handled by Vercel/CDN)

### API Response Time Targets

**Not Defined**: No explicit targets
- Supabase typically < 100ms for simple queries
- Complex queries may take longer

**Optimization Opportunities**:
- Cache frequently accessed data
- Batch multiple queries
- Use database views for complex queries

---

## 17. Configuration Files

### package.json

**Purpose**: npm package configuration

**Key Settings**:
- `name`: "web-app"
- `version`: "0.1.0"
- `private`: true (not publishable)

**Scripts**:
- `dev`: `next dev` - Development server
- `build`: `next build` - Production build
- `start`: `next start` - Production server
- `lint`: `eslint` - Code linting

**Dependencies**: See [Section 19](#19-dependencies--packages)

### tsconfig.json

**Purpose**: TypeScript compiler configuration

**Key Settings**:
- `target`: "ES2017" - Compile target
- `lib`: ["dom", "dom.iterable", "esnext"] - Library files
- `strict`: true - Strict type checking
- `jsx`: "react-jsx" - React JSX transform
- `paths`: `@/*` → `./src/*` - Path aliases

**Module Resolution**: `bundler` (Next.js default)

### next.config.ts

**Purpose**: Next.js configuration

**Current**: Empty (defaults used)
```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Available Options** (not set):
- `env` - Environment variables
- `images` - Image optimization
- `redirects` - URL redirects
- `rewrites` - URL rewrites

### tailwind.config.ts

**Purpose**: Tailwind CSS configuration

**Key Settings**:
- `darkMode`: "class" - Dark mode toggle method
- `content`: Paths to scan for classes
- `theme.extend`: Custom colors, fonts, shadows

**Custom Colors**:
- `primary`: #13ecc8
- `primary-dark`: #0fbda0
- `background-light`: #f6f8f8
- `background-dark`: #10221f

### postcss.config.mjs

**Purpose**: PostCSS configuration

**Plugins**:
- `@tailwindcss/postcss` - Tailwind CSS processing

### eslint.config.mjs

**Purpose**: ESLint configuration

**Extends**:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

**Ignores**:
- `.next/**`
- `out/**`
- `build/**`
- `next-env.d.ts`

### .env.local (Not Committed)

**Purpose**: Environment variables for local development

**Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Security**: Not committed to Git (in `.gitignore`)

---

## 18. Known Issues & Technical Debt

### Current Bugs

1. **Task Approval Not Atomic**
   - **Issue**: Task approval updates task status, then separately updates child stats
   - **Risk**: Race condition if concurrent approvals
   - **Location**: `src/app/parent/approvals/page.tsx` → `handleApprove()`
   - **Fix**: Should use database transaction or single RPC function

2. **Child Logout Button Logic**
   - **Issue**: When parent views as child, logout button says "Exit Child View" but logic was inconsistent
   - **Status**: Fixed in recent changes
   - **Location**: `src/app/child/components/ChildSidebar.tsx`

3. **Task Count Mismatch**
   - **Issue**: Parent dashboard showed 0 pending when tasks were ready for review
   - **Status**: Fixed - now queries `assigned_tasks` with `status: 'ready_for_review'`
   - **Location**: `src/app/parent/dashboard/page.tsx`

4. **Real-time Not Always Working**
   - **Issue**: Real-time subscriptions may not be enabled in Supabase
   - **Status**: Requires running `enable_realtime.sql`
   - **Fix**: Documented in setup instructions

### Areas Needing Refactoring

1. **State Management**
   - **Issue**: No global state, lots of prop drilling
   - **Opportunity**: Use Zustand (already installed) for shared state
   - **Files**: Multiple components

2. **Error Handling**
   - **Issue**: Inconsistent error handling patterns
   - **Opportunity**: Create error boundary components
   - **Files**: All pages

3. **API Calls**
   - **Issue**: Duplicate query logic across components
   - **Opportunity**: Create custom hooks for data fetching
   - **Example**: `useChildren()`, `useTasks()`, `useRewards()`

4. **Type Safety**
   - **Issue**: Some `any` types used
   - **Opportunity**: Strict typing throughout
   - **Files**: Multiple components

### Performance Bottlenecks

1. **N+1 Queries**
   - **Issue**: Fetching children, then fetching tasks for each child
   - **Location**: `src/app/parent/dashboard/page.tsx`
   - **Fix**: Batch queries or use JOINs

2. **No Caching**
   - **Issue**: All data fetched fresh on every render
   - **Opportunity**: Implement React Query or SWR
   - **Impact**: Unnecessary API calls

3. **Large Bundle Size**
   - **Issue**: Not measured, but likely includes unused code
   - **Fix**: Analyze with bundle analyzer, implement code splitting

### Deprecated Dependencies

**None Currently**: All dependencies are up-to-date

### Security Concerns

1. **No Rate Limiting**
   - **Issue**: API endpoints not rate-limited
   - **Risk**: Abuse, DoS
   - **Fix**: Implement rate limiting middleware

2. **PIN Lockout Bypass**
   - **Issue**: PIN lockout can be reset via SQL (bypass)
   - **Risk**: Security feature can be circumvented
   - **Fix**: Add application-level lockout enforcement

3. **No CSRF Protection**
   - **Issue**: State-changing operations not protected
   - **Risk**: CSRF attacks
   - **Fix**: Add CSRF tokens

4. **Environment Variables Exposed**
   - **Issue**: `NEXT_PUBLIC_*` variables exposed in client bundle
   - **Status**: Acceptable for Supabase anon key (protected by RLS)
   - **Note**: No sensitive secrets should use `NEXT_PUBLIC_*` prefix

---

## 19. Dependencies & Packages

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.89.0 | Supabase client library |
| `@tailwindcss/container-queries` | ^0.1.1 | Container query support |
| `@tailwindcss/forms` | ^0.5.11 | Form styling |
| `date-fns` | ^4.1.0 | Date manipulation |
| `next` | 16.1.1 | Next.js framework |
| `react` | 19.2.3 | React library |
| `react-dom` | 19.2.3 | React DOM rendering |
| `zustand` | ^5.0.9 | State management (not actively used) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |
| `@types/node` | ^20 | Node.js types |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.1.1 | Next.js ESLint config |
| `tailwindcss` | ^4 | Tailwind CSS |
| `typescript` | ^5 | TypeScript compiler |

### Version Pinning Strategy

**Current**: Caret ranges (^) - Allows minor/patch updates
- Example: `^2.89.0` allows `2.89.x` and `2.x.x` but not `3.x.x`

**Lock File**: `package-lock.json` - Locks exact versions

**Recommendation**: Consider pinning exact versions for production

---

## 20. Code Patterns & Conventions

### Naming Conventions

**Files**:
- **Components**: PascalCase (e.g., `ChildSidebar.tsx`)
- **Pages**: `page.tsx` (Next.js convention)
- **Utilities**: camelCase (e.g., `child-session.ts`)
- **Types**: `supabase.ts` (generated)

**Variables**:
- **camelCase**: `childName`, `isLoading`, `handleSubmit`
- **Constants**: UPPER_SNAKE_CASE (not used much)
- **Boolean flags**: `is*` prefix (e.g., `isOpen`, `isLoading`)

**Functions**:
- **camelCase**: `handleTaskComplete`, `fetchData`
- **Event handlers**: `handle*` prefix
- **Async functions**: No special prefix

**Components**:
- **PascalCase**: `ChildSidebar`, `ApprovalModal`
- **Props interfaces**: `ComponentNameProps` (e.g., `ChildSidebarProps`)

### Code Organization Patterns

**Component Structure**:
```typescript
// Imports
import ...

// Types/Interfaces
interface Props { ... }

// Component
export function Component({ props }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return <div>...</div>;
}
```

**Page Structure**:
- Authentication check
- Data fetching
- Loading state
- Error handling
- Main render

### Common Utilities & Helpers

**`src/lib/supabase.ts`**:
- `supabase` - Supabase client instance
- `isSessionExpiredError()` - Check if error is auth expiry
- `isDatabaseError()` - Check if error is database/RLS

**`src/lib/child-session.ts`**:
- `enterChildMode()` - Enter child mode
- `exitChildMode()` - Exit child mode
- `isInChildMode()` - Check if in child mode
- `getActiveChildId()` - Get active child ID
- `clearAllSessionData()` - Clear all session data

**`src/lib/analytics-utils.ts`**:
- `calculateKPI()` - Calculate KPI with trend
- `getConsistencyBand()` - Get consistency color band
- `getMomentumLabel()` - Get momentum label
- `calculateCompletionRate()` - Calculate completion percentage
- `formatMinutes()` - Format minutes to "1h 30m"
- `countUniqueDaysWithActivity()` - Count active days

### Design Patterns Used

1. **Container/Presentational Pattern**
   - Pages are containers (data fetching, logic)
   - Components are presentational (display, events)

2. **Custom Hooks Pattern** (Not extensively used)
   - Could extract data fetching to hooks
   - Example: `useChildren()`, `useTasks()`

3. **Modal Pattern**
   - Controlled modals with `isOpen` prop
   - `onClose` callback
   - Examples: `AddAssignedTaskModal`, `ApprovalModal`

4. **Guard Pattern**
   - `ChildModeGuard` protects routes
   - Checks condition, redirects if needed

### Error Handling Patterns

**Try-Catch Blocks**:
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  // Success
} catch (err) {
  console.error(err);
  alert("Error message");
}
```

**Error Display**:
- Inline errors in forms
- Alert dialogs for critical errors
- Console logging for debugging

**Error Types**:
- Network errors → Retry option
- Auth errors → Redirect to login
- Permission errors → Show message

### Code Quality

**TypeScript**: Strict mode enabled
- Type safety enforced
- Some `any` types still present (technical debt)

**ESLint**: Configured with Next.js rules
- Catches common errors
- Enforces code style

**No Prettier**: Code formatting not automated
- Inconsistent formatting possible

---

## Conclusion

This technical documentation provides a comprehensive overview of the Task For Time application's architecture, implementation, and technical details. The application is a modern Next.js web application using Supabase as the backend, with a focus on family task management and gamification.

**Key Strengths**:
- Modern tech stack (Next.js 16, React 19, TypeScript)
- Secure architecture (RLS policies, JWT auth)
- Real-time capabilities (Supabase Realtime)
- Type-safe codebase (TypeScript)

**Areas for Improvement**:
- Testing (no tests currently)
- Performance optimization (caching, code splitting)
- Error handling (more consistent patterns)
- State management (consider Zustand for global state)

**Next Steps**:
1. Implement testing framework
2. Add performance monitoring
3. Optimize database queries
4. Implement caching strategy
5. Add error boundaries
6. Set up CI/CD pipeline

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-02  
**Maintained By**: Development Team

