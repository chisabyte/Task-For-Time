"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function NotificationsSection() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notifyTaskApprovals, setNotifyTaskApprovals] = useState(true);
    const [notifyDailySummary, setNotifyDailySummary] = useState(false);
    const [notifyProductUpdates, setNotifyProductUpdates] = useState(true);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('notify_task_approvals, notify_daily_summary, notify_product_updates')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setNotifyTaskApprovals(profile.notify_task_approvals !== false);
                    setNotifyDailySummary(profile.notify_daily_summary === true);
                    setNotifyProductUpdates(profile.notify_product_updates !== false);
                }
            } catch (error) {
                console.error('Error fetching notification preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, []);

    const updatePreference = async (field: 'notify_task_approvals' | 'notify_daily_summary' | 'notify_product_updates', value: boolean) => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ [field]: value })
                .eq('id', user.id);

            if (error) {
                console.error('Error updating preference:', error);
                alert('Failed to update preference. Please try again.');
                return;
            }

            // Update local state
            if (field === 'notify_task_approvals') setNotifyTaskApprovals(value);
            if (field === 'notify_daily_summary') setNotifyDailySummary(value);
            if (field === 'notify_product_updates') setNotifyProductUpdates(value);
        } catch (error) {
            console.error('Error updating preference:', error);
            alert('Failed to update preference. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="space-y-6" id="notifications">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                        <span className="material-symbols-outlined">notifications</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-6" id="notifications">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    <span className="material-symbols-outlined">notifications</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Task Approvals</h4>
                        <p className="text-xs text-gray-500 mt-1">Get notified when your child submits a task for review.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notifyTaskApprovals}
                            onChange={(e) => updatePreference('notify_task_approvals', e.target.checked)}
                            disabled={saving}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary disabled:opacity-50"></div>
                    </label>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Daily Summary</h4>
                        <p className="text-xs text-gray-500 mt-1">Receive a nightly email summary of today&apos;s progress.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notifyDailySummary}
                            onChange={(e) => updatePreference('notify_daily_summary', e.target.checked)}
                            disabled={saving}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary disabled:opacity-50"></div>
                    </label>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Product Updates</h4>
                        <p className="text-xs text-gray-500 mt-1">Occasional news about new features.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notifyProductUpdates}
                            onChange={(e) => updatePreference('notify_product_updates', e.target.checked)}
                            disabled={saving}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary disabled:opacity-50"></div>
                    </label>
                </div>
            </div>
        </section>
    );
}
