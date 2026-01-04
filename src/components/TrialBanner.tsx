"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPremiumStatus, getPremiumStatus, OWNER_EMAIL } from "@/lib/premium";
import { UpgradeModal } from "./UpgradeModal";

export function TrialBanner() {
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [plan, setPlan] = useState<'trial' | 'free' | 'pro'>('trial');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, trial_ends_at, is_owner')
          .eq('id', user.id)
          .single();

        if (profile) {
          setPlan(profile.plan || 'trial');
          // Check both is_owner flag and owner email
          const ownerStatus = profile.is_owner || (user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
          setIsOwner(ownerStatus);

          const status = getPremiumStatus({
            plan: profile.plan || 'trial',
            trialEndsAt: profile.trial_ends_at,
            isOwner: profile.is_owner || false,
            email: user.email
          });
          setPremiumStatus(status);
        }
      } catch (error) {
        console.error('Error loading premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  if (loading || !premiumStatus) return null;

  // Don't show banner for owners
  if (isOwner) return null;

  // Don't show banner if premium is active and not in trial
  if (premiumStatus.isPremiumActive && !premiumStatus.isTrial) return null;

  // Show trial countdown
  if (premiumStatus.isTrial && premiumStatus.isPremiumActive && premiumStatus.daysRemaining !== null) {
    return (
      <>
        <div className="w-full bg-gradient-to-r from-primary/10 to-teal-500/10 border-b border-primary/20 py-3 px-4">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">timer</span>
              <span className="text-sm font-medium text-text-main dark:text-white">
                Free trial: <strong>{premiumStatus.daysRemaining} days</strong> remaining
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-1.5 rounded-lg bg-primary text-text-main font-bold text-sm hover:brightness-105 transition-all"
            >
              Upgrade
            </button>
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          source="banner"
        />
      </>
    );
  }

  // Show expired trial message
  if (premiumStatus.expired || (!premiumStatus.isPremiumActive && plan === 'trial')) {
    return (
      <>
        <div className="w-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20 py-3 px-4">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">info</span>
              <span className="text-sm font-medium text-text-main dark:text-white">
                Your free trial has ended
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-1.5 rounded-lg bg-primary text-text-main font-bold text-sm hover:brightness-105 transition-all"
            >
              Upgrade
            </button>
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          source="banner"
        />
      </>
    );
  }

  return null;
}

