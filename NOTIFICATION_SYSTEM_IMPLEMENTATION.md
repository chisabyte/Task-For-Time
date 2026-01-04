# Notification System Implementation

## Overview
Complete email notification system for parents using Resend, with preference-based opt-in/opt-out.

## Files Created/Modified

### SQL Migration
- **`supabase/migrations/011_notification_preferences.sql`**
  - Adds `notify_task_approvals`, `notify_daily_summary`, `notify_product_updates` columns to `profiles` table
  - Sets defaults: task approvals (true), daily summary (false), product updates (true)

### Email Infrastructure
- **`src/lib/email.ts`**
  - `sendEmail()` - Core email helper using Resend
  - `sendTaskApprovalEmail()` - Task approval notification
  - `sendDailySummaryEmail()` - Daily summary email
  - `sendProductUpdateEmail()` - Product update email

### API Routes
- **`src/app/api/notifications/task-submitted/route.ts`**
  - POST endpoint called when child submits task
  - Checks parent notification preferences
  - Sends email to all opted-in parents in family

- **`src/app/api/notifications/daily-summary/route.ts`**
  - GET endpoint for daily cron job
  - Runs once daily (evening)
  - Sends summary to parents with `notify_daily_summary = true`

### UI Components
- **`src/app/parent/settings/components/NotificationsSection.tsx`**
  - Converted to client component
  - Fetches and saves notification preferences
  - Three toggles: Task Approvals, Daily Summary, Product Updates

### Task Submission Integration
- **`src/app/child/dashboard/page.tsx`**
  - Calls `/api/notifications/task-submitted` after successful task submission
  - Non-blocking (doesn't prevent navigation if email fails)

### Product Updates Helper
- **`src/lib/product-updates.ts`**
  - `sendProductUpdateToAllUsers()` - Helper to send product updates
  - Only sends to users with `notify_product_updates = true`

### Cron Configuration
- **`vercel.json`**
  - Vercel cron job configuration
  - Runs daily at 8 PM (20:00 UTC)

## Environment Variables Required

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://taskfortime.com
CRON_SECRET=your-secret-key (optional, for cron security)
```

## Database Schema

### profiles table additions:
- `notify_task_approvals BOOLEAN DEFAULT true`
- `notify_daily_summary BOOLEAN DEFAULT false`
- `notify_product_updates BOOLEAN DEFAULT true`

## Notification Flow

### Task Approval Emails
1. Child submits task → status changes to `ready_for_review`
2. Client calls `/api/notifications/task-submitted`
3. API checks parent preferences (`notify_task_approvals`)
4. Sends email to all opted-in parents
5. Email includes: child name, task name, approve link

### Daily Summary Emails
1. Cron job calls `/api/notifications/daily-summary` daily at 8 PM
2. Fetches all parents with `notify_daily_summary = true`
3. Calculates today's stats (tasks, XP, rewards)
4. Sends personalized summary email

### Product Updates
- Manual function: `sendProductUpdateToAllUsers()`
- Only sends to users with `notify_product_updates = true`
- Not automated (call manually when needed)

## Email Templates

All emails use HTML templates with:
- Branded header with gradient
- Clear, readable content
- Call-to-action buttons
- Responsive design
- Consistent styling

## Security

- Uses Supabase Service Role Key for admin operations (email lookup)
- Respects user preferences (no emails if disabled)
- Parents only (no child emails)
- Non-blocking (email failures don't break app flow)

## Testing Checklist

- [ ] Run SQL migration to add notification columns
- [ ] Set RESEND_API_KEY environment variable
- [ ] Set SUPABASE_SERVICE_ROLE_KEY environment variable
- [ ] Test notification preferences toggles save correctly
- [ ] Submit task as child → verify parent receives email
- [ ] Disable task approval notifications → verify no email sent
- [ ] Test daily summary cron (or call endpoint manually)
- [ ] Test product update helper function
- [ ] Verify no duplicate emails sent
- [ ] Check email logs in Resend dashboard

## Usage Examples

### Send Product Update (Manual)
```typescript
import { sendProductUpdateToAllUsers } from '@/lib/product-updates';

await sendProductUpdateToAllUsers({
  title: 'New Feature: Family Quests!',
  content: 'We just launched Family Quests...',
  ctaText: 'Try It Now',
  ctaUrl: 'https://taskfortime.com/parent/dashboard'
});
```

### Test Daily Summary (Manual)
```bash
curl -X GET https://your-app.vercel.app/api/notifications/daily-summary \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Notes

- Email sending is non-blocking and logged
- Failed emails don't prevent app functionality
- All emails respect user preferences
- No emails sent to children (parents only)
- Daily summary runs via Vercel Cron (configure in Vercel dashboard)

