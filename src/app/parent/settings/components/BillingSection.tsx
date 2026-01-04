"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPremiumStatus, OWNER_EMAIL } from "@/lib/premium";
import { UpgradeModal } from "@/components/UpgradeModal";

export function BillingSection() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<'trial' | 'free' | 'pro'>('trial');
    const [isOwner, setIsOwner] = useState(false);
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [premiumStatus, setPremiumStatus] = useState<any>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        const fetchPlanStatus = async () => {
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
                    setTrialEndsAt(profile.trial_ends_at);

                    const status = getPremiumStatus({
                        plan: profile.plan || 'trial',
                        trialEndsAt: profile.trial_ends_at,
                        isOwner: profile.is_owner || false,
                        email: user.email
                    });
                    setPremiumStatus(status);
                }
            } catch (error) {
                console.error('Error fetching plan status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanStatus();
    }, []);

    if (loading) {
        return (
            <section className="space-y-6" id="billing">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan & Billing</h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </section>
        );
    }

    // Owner account - premium access enabled
    if (isOwner) {
        return (
            <section className="space-y-6" id="billing">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan & Billing</h2>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-2xl p-6 border border-primary/30 dark:border-primary/20 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-2xl">star</span>
                                <h3 className="text-2xl font-black text-text-main dark:text-white">Owner Account</h3>
                            </div>
                            <p className="text-text-sub dark:text-gray-400 mb-4">Premium access enabled</p>
                            <p className="text-sm text-text-sub dark:text-gray-500">
                                You have full access to all features including AI Coaching, Weekly Reports, and Advanced Analytics.
                            </p>
                        </div>
                        <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                            Active
                        </span>
                    </div>
                </div>
            </section>
        );
    }

    // Trial active
    if (plan === 'trial' && premiumStatus?.isPremiumActive && premiumStatus?.isTrial) {
        return (
            <section className="space-y-6" id="billing">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <span className="material-symbols-outlined">credit_card</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan & Billing</h2>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-2xl p-6 border border-primary/30 dark:border-primary/20 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-2xl">timer</span>
                                <h3 className="text-2xl font-black text-text-main dark:text-white">Free Trial</h3>
                            </div>
                            <p className="text-text-sub dark:text-gray-400 mb-4">
                                <strong>{premiumStatus.daysRemaining} days</strong> remaining
                            </p>
                            <p className="text-sm text-text-sub dark:text-gray-500 mb-4">
                                No payment method required. Enjoy full access to all premium features during your trial.
                            </p>
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="px-4 py-2 bg-primary text-text-main font-bold rounded-lg text-sm hover:brightness-105 transition-all shadow-sm"
                            >
                                Notify me when paid plans launch
                            </button>
                        </div>
                        <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">
                            Active
                        </span>
                    </div>
                </div>
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    source="billing"
                />
            </section>
        );
    }

    // Trial expired or free plan
    return (
        <section className="space-y-6" id="billing">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <span className="material-symbols-outlined">credit_card</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan & Billing</h2>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-2xl">account_circle</span>
                            <h3 className="text-2xl font-black text-text-main dark:text-white">Free Plan</h3>
                        </div>
                        <p className="text-text-sub dark:text-gray-400 mb-4">
                            {plan === 'trial' ? 'Your free trial has ended.' : 'You are on the free plan.'}
                        </p>
                        <p className="text-sm text-text-sub dark:text-gray-500 mb-4">
                            Core features are available. Premium features (AI Coaching, Weekly Reports, Advanced Analytics) require an upgrade.
                        </p>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-4 py-2 bg-primary text-text-main font-bold rounded-lg text-sm hover:brightness-105 transition-all shadow-sm"
                        >
                            Upgrade (coming soon)
                        </button>
                    </div>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">
                        Free
                    </span>
                </div>
            </div>
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                source="billing"
            />
        </section>
    );
}
