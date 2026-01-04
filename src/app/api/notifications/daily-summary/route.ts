import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDailySummaryEmail } from '@/lib/email';

/**
 * Daily summary email cron job
 * Should be called once daily (evening) via Vercel Cron or Supabase Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all parents with daily summary enabled
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, family_id, display_name, notify_daily_summary')
      .eq('role', 'parent')
      .eq('notify_daily_summary', true);

    if (parentsError) {
      console.error('[Daily Summary] Error fetching parents:', parentsError);
      return NextResponse.json(
        { error: 'Failed to fetch parents' },
        { status: 500 }
      );
    }

    if (!parents || parents.length === 0) {
      console.log('[Daily Summary] No parents have daily summary enabled');
      return NextResponse.json({ success: true, sent: 0 });
    }

    // Get today's date range (start of day to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date().toISOString();

    // Process each parent
    const emailResults = await Promise.allSettled(
      parents.map(async (parent) => {
        // Get parent email
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(parent.id);
        if (authError || !authUser?.user?.email) {
          console.warn(`[Daily Summary] No email for parent ${parent.id}`);
          return { success: false, error: 'No email found' };
        }

        // Get children in family
        const { data: children } = await supabase
          .from('children')
          .select('id, name')
          .eq('family_id', parent.family_id)
          .is('deleted_at', null);

        if (!children || children.length === 0) {
          return { success: false, error: 'No children found' };
        }

        // Get tasks completed today
        const { data: completedTasks } = await supabase
          .from('assigned_tasks')
          .select('child_id, reward_minutes')
          .eq('family_id', parent.family_id)
          .eq('status', 'approved')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd);

        // Get reward redemptions today
        const { data: redemptions } = await supabase
          .from('reward_redemptions')
          .select('child_id, minutes_spent')
          .eq('family_id', parent.family_id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd);

        // Calculate totals
        const tasksCompleted = completedTasks?.length || 0;
        const xpEarned = (completedTasks?.length || 0) * 10; // 10 XP per task
        const rewardsRedeemed = redemptions?.length || 0;

        // Calculate per-child stats
        const childrenStats = children.map(child => {
          const childTasks = completedTasks?.filter(t => t.child_id === child.id) || [];
          const childXp = childTasks.length * 10;
          return {
            name: child.name,
            tasksCompleted: childTasks.length,
            xpEarned: childXp
          };
        });

        // Send email
        return await sendDailySummaryEmail(
          authUser.user.email,
          parent.display_name || 'Parent',
          {
            tasksCompleted,
            xpEarned,
            rewardsRedeemed,
            children: childrenStats
          }
        );
      })
    );

    const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = emailResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`[Daily Summary] Sent ${successful} emails, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: parents.length
    });
  } catch (error: any) {
    console.error('[Daily Summary] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send daily summaries' },
      { status: 500 }
    );
  }
}

