/**
 * Premium Status Helper
 * Single source of truth for premium access logic
 */

// Owner email - this account ALWAYS has full premium access with no restrictions
// Set via NEXT_PUBLIC_OWNER_EMAIL environment variable in .env.local
export const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || '';

export type Plan = 'trial' | 'free' | 'pro';

export interface PremiumStatusInput {
  plan: Plan;
  trialEndsAt: string | null;
  isOwner: boolean;
  email?: string; // Optional: used for owner email check
}

export interface PremiumStatus {
  isPremiumActive: boolean;
  isTrial: boolean;
  expired: boolean;
  daysRemaining: number | null;
}

/**
 * Calculate premium status based on plan, trial dates, and owner status
 * 
 * Rules:
 * - If isOwner === true OR email === OWNER_EMAIL → premium ALWAYS active
 * - Else if plan === 'pro' → premium active
 * - Else if plan === 'trial' && now < trialEndsAt → premium active
 * - Else → premium inactive
 */
export function getPremiumStatus({
  plan,
  trialEndsAt,
  isOwner,
  email
}: PremiumStatusInput): PremiumStatus {
  const now = new Date();

  // Owner override: premium is ALWAYS active
  // Check both the is_owner flag AND the owner email
  const isOwnerAccount = isOwner || (email && email.toLowerCase() === OWNER_EMAIL.toLowerCase());

  if (isOwnerAccount) {
    return {
      isPremiumActive: true,
      isTrial: false,
      expired: false,
      daysRemaining: null
    };
  }

  // Pro plan: premium active
  if (plan === 'pro') {
    return {
      isPremiumActive: true,
      isTrial: false,
      expired: false,
      daysRemaining: null
    };
  }

  // Trial plan: check if still active
  if (plan === 'trial' && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    const isActive = now < trialEnd;
    const daysRemaining = isActive
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      isPremiumActive: isActive,
      isTrial: true,
      expired: !isActive,
      daysRemaining: isActive ? daysRemaining : 0
    };
  }

  // Free plan or expired trial: premium inactive
  return {
    isPremiumActive: false,
    isTrial: plan === 'trial',
    expired: plan === 'trial',
    daysRemaining: null
  };
}

/**
 * Fetch premium status from database for current user
 */
export async function fetchPremiumStatus(supabase: any): Promise<PremiumStatus | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at, is_owner')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;

    return getPremiumStatus({
      plan: profile.plan || 'trial',
      trialEndsAt: profile.trial_ends_at,
      isOwner: profile.is_owner || false,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching premium status:', error);
    return null;
  }
}

