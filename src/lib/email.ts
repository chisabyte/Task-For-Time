/**
 * Email helper using Resend
 * All emails must go through this helper
 */

import { Resend } from 'resend';

// Defer instantiation to runtime
let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}


export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 * 
 * @param options Email options
 * @returns Promise with result or error
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const client = getResend();

  if (!client) {
    console.error('[Email] RESEND_API_KEY not configured or client failed to instantiate');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await client.emails.send({
      from: options.from || 'Task For Time <noreply@taskfortime.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('[Email] Resend error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    console.log('[Email] Sent successfully:', { to: options.to, subject: options.subject, id: result.data?.id });
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Exception:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send task approval notification email
 */
export async function sendTaskApprovalEmail(
  parentEmail: string,
  childName: string,
  taskName: string,
  approveUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #13ecc8 0%, #0fbda0 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Task Ready for Approval</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            <strong>${childName}</strong> has completed a task and is waiting for your approval.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #13ecc8;">
            <p style="margin: 0; font-size: 18px; font-weight: 600;">${taskName}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approveUrl}" style="display: inline-block; background: #13ecc8; color: #111817; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Review & Approve
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0; text-align: center;">
            Or visit <a href="${approveUrl}" style="color: #13ecc8;">${approveUrl}</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Task For Time - Building habits, not conflict
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: parentEmail,
    subject: 'Task ready for approval',
    html,
  });
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(
  parentEmail: string,
  parentName: string,
  summary: {
    tasksCompleted: number;
    xpEarned: number;
    rewardsRedeemed: number;
    children: Array<{ name: string; tasksCompleted: number; xpEarned: number }>;
  }
): Promise<{ success: boolean; error?: string }> {
  const childrenList = summary.children
    .map(child => `<li style="margin: 10px 0;"><strong>${child.name}</strong>: ${child.tasksCompleted} tasks completed, ${child.xpEarned} XP earned</li>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #13ecc8 0%, #0fbda0 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Daily Summary</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            Hi ${parentName},
          </p>
          <p style="font-size: 16px; margin: 0 0 30px 0;">
            Here's what happened in your family today:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #13ecc8;">${summary.tasksCompleted}</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Tasks Completed</div>
              </div>
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #13ecc8;">${summary.xpEarned}</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">XP Earned</div>
              </div>
              <div>
                <div style="font-size: 32px; font-weight: bold; color: #13ecc8;">${summary.rewardsRedeemed}</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Rewards Redeemed</div>
              </div>
            </div>
          </div>
          ${summary.children.length > 0 ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px;">By Child:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${childrenList}
              </ul>
            </div>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taskfortime.com'}/parent/dashboard" style="display: inline-block; background: #13ecc8; color: #111817; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Task For Time - Building habits, not conflict
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: parentEmail,
    subject: 'Your daily family summary',
    html,
  });
}

/**
 * Send product update email
 */
export async function sendProductUpdateEmail(
  parentEmail: string,
  parentName: string,
  update: {
    title: string;
    content: string;
    ctaText?: string;
    ctaUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const ctaButton = update.ctaUrl && update.ctaText ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${update.ctaUrl}" style="display: inline-block; background: #13ecc8; color: #111817; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ${update.ctaText}
      </a>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #13ecc8 0%, #0fbda0 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${update.title}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            Hi ${parentName},
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${update.content.split('\n').map(para => `<p style="margin: 0 0 15px 0;">${para}</p>`).join('')}
          </div>
          ${ctaButton}
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Task For Time - Building habits, not conflict
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: parentEmail,
    subject: update.title,
    html,
  });
}

