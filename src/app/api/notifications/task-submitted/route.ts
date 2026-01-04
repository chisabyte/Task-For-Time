import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTaskApprovalEmail } from '@/lib/email';

/**
 * API route to send task approval notification email
 * Called when a child submits a task for review
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId, familyId, childId } = await request.json();

    if (!taskId || !familyId || !childId) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, familyId, childId' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Create Supabase client (server-side, no auth needed for this operation)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('assigned_tasks')
      .select('title, child_id, family_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('[Task Notification] Task not found:', taskError);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get child details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('name')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      console.error('[Task Notification] Child not found:', childError);
      return NextResponse.json(
        { error: 'Child not found' },
        { status: 404 }
      );
    }

    // Get all parents in the family with notification preferences
    const { data: parents, error: parentsError } = await supabase
      .from('profiles')
      .select('id, notify_task_approvals')
      .eq('family_id', familyId)
      .eq('role', 'parent');

    if (parentsError || !parents || parents.length === 0) {
      console.error('[Task Notification] Parents not found:', parentsError);
      return NextResponse.json(
        { error: 'No parents found' },
        { status: 404 }
      );
    }

    // Filter parents who want task approval notifications
    const parentsToNotify = parents.filter(p => p.notify_task_approvals !== false);
    
    if (parentsToNotify.length === 0) {
      console.log('[Task Notification] No parents have task approval notifications enabled');
      return NextResponse.json({ success: true, message: 'No notifications sent (preferences disabled)' });
    }

    // Get parent emails - use service role key for admin access
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      console.error('[Task Notification] SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Build approve URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taskfortime.com';
    const approveUrl = `${baseUrl}/parent/approvals`;

    // Send emails to all parents who want notifications
    const emailResults = await Promise.allSettled(
      parentsToNotify.map(async (parent) => {
        // Get user email from auth.users using admin client
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(parent.id);
        
        if (authError || !authUser?.user?.email) {
          console.warn(`[Task Notification] No email found for parent ${parent.id}:`, authError);
          return { success: false, error: 'No email found' };
        }

        return await sendTaskApprovalEmail(
          authUser.user.email,
          child.name,
          task.title,
          approveUrl
        );
      })
    );

    // Log results
    const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = emailResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`[Task Notification] Sent ${successful} emails, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
    });
  } catch (error: any) {
    console.error('[Task Notification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

