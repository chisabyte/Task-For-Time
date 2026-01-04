"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getPremiumStatus } from "@/lib/premium";
import { UpgradeModal } from "./UpgradeModal";

interface PremiumGateProps {
  children: React.ReactNode;
  featureName: string; // 'coaching', 'reports', 'analytics', etc.
  fallback?: React.ReactNode;
}

export function PremiumGate({ children, featureName, fallback }: PremiumGateProps) {
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If premium is active, show the content
  if (premiumStatus?.isPremiumActive) {
    return <>{children}</>;
  }

  // Show lock screen
  return (
    <>
      {fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-5xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">
            Premium Feature
          </h2>
          <p className="text-text-sub dark:text-gray-400 mb-6 max-w-md">
            {featureName === 'coaching' && "AI Coaching helps you understand your family's patterns and provides personalized recommendations."}
            {featureName === 'reports' && "Weekly Reports give you detailed insights into your family's progress and achievements."}
            {featureName === 'analytics' && "Advanced Analytics provide deep insights into task completion, consistency, and trends."}
            {!['coaching', 'reports', 'analytics'].includes(featureName) && "This feature is available with a premium plan."}
          </p>
          <p className="text-sm text-text-sub dark:text-gray-400 mb-6">
            Paid plans launching soon.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-3 rounded-lg bg-primary text-text-main font-bold hover:brightness-105 transition-all"
          >
            Upgrade
          </button>
        </div>
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        source={featureName}
      />
    </>
  );
}

