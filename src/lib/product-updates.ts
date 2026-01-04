/**
 * Product Update Email Helper
 * Send product update emails to opted-in users
 */

import { createClient } from '@supabase/supabase-js';
import { sendProductUpdateEmail } from './email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Send product update email to all users with notify_product_updates enabled
 * 
 * @param update Product update content
 * @returns Result with sent/failed counts
 */
export async function sendProductUpdateToAllUsers(update: {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{ sent: number; failed: number; total: number }> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get all parents with product updates enabled
  const { data: parents, error } = await supabase
    .from('profiles')
    .select('id, display_name, notify_product_updates')
    .eq('role', 'parent')
    .eq('notify_product_updates', true);

  if (error) {
    throw new Error(`Failed to fetch parents: ${error.message}`);
  }

  if (!parents || parents.length === 0) {
    console.log('[Product Update] No parents have product updates enabled');
    return { sent: 0, failed: 0, total: 0 };
  }

  // Send emails to all opted-in parents
  const emailResults = await Promise.allSettled(
    parents.map(async (parent) => {
      // Get parent email
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(parent.id);
      if (authError || !authUser?.user?.email) {
        console.warn(`[Product Update] No email for parent ${parent.id}`);
        return { success: false, error: 'No email found' };
      }

      return await sendProductUpdateEmail(
        authUser.user.email,
        parent.display_name || 'Parent',
        update
      );
    })
  );

  const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = emailResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

  console.log(`[Product Update] Sent ${successful} emails, ${failed} failed`);

  return {
    sent: successful,
    failed,
    total: parents.length
  };
}

