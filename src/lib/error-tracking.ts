/**
 * Error Tracking Utility
 * 
 * Basic error tracking that can be upgraded to Sentry later.
 * For now, logs to console and can send to external service.
 * 
 * To upgrade to Sentry:
 * 1. Install @sentry/nextjs
 * 2. Initialize Sentry in next.config.ts
 * 3. Replace console.error with Sentry.captureException
 */

interface ErrorContext {
  userId?: string;
  userRole?: string;
  action?: string;
  taskId?: string;
  childId?: string;
  [key: string]: any;
}

export function trackError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log to console (remove in production or replace with Sentry)
  console.error('[Error Tracking]', {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString()
  });

  // TODO: Send to Sentry when configured
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

export function trackApprovalFailure(
  taskId: string,
  error: Error | unknown,
  userId?: string
): void {
  trackError(error, {
    action: 'task_approval',
    taskId,
    userId,
    severity: 'high'
  });
}

export function trackRedemptionFailure(
  rewardId: string,
  childId: string,
  error: Error | unknown,
  userId?: string
): void {
  trackError(error, {
    action: 'reward_redemption',
    rewardId,
    childId,
    userId,
    severity: 'high'
  });
}

export function trackAuthError(
  error: Error | unknown,
  action: string,
  userId?: string
): void {
  trackError(error, {
    action: `auth_${action}`,
    userId,
    severity: 'critical'
  });
}

export function trackSessionError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  trackError(error, {
    action: 'session_error',
    ...context,
    severity: 'high'
  });
}

