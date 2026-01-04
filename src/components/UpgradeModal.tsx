"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string; // 'banner', 'coaching', 'reports', 'analytics', etc.
}

export function UpgradeModal({ isOpen, onClose, source }: UpgradeModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to be notified");
        setLoading(false);
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        alert("Error: Profile not found");
        setLoading(false);
        return;
      }

      // Save upgrade intent
      const { error } = await supabase
        .from('upgrade_intents')
        .insert({
          user_id: user.id,
          family_id: profile.family_id,
          email: email || user.email || '',
          source: source
        });

      if (error) {
        console.error('Error saving upgrade intent:', error);
        alert("Error saving request. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setEmail("");
      }, 2000);
    } catch (error) {
      console.error('Error in upgrade modal:', error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-card-dark rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">Thank you!</h2>
            <p className="text-text-sub dark:text-gray-400">We'll notify you when paid plans launch.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">Paid Plans Launching Soon</h2>
              <p className="text-text-sub dark:text-gray-400">
                We're working on premium features. Enter your email to be notified when paid plans are available.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-main dark:text-white mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white px-4 py-2 focus:ring-primary focus:border-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-text-main font-bold hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Notify Me"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

