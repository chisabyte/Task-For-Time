"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppAvatar } from "@/components/AppAvatar";

export function AccountSection() {
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // PIN management state
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);
    const [pinSaving, setPinSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            const { data } = await supabase
                .from('profiles')
                .select('*, is_owner')
                .eq('id', user.id)
                .single();

            setProfile(data);
            setPinEnabled(!!data?.pin_hash);
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        const formData = new FormData(e.currentTarget);
        const displayName = formData.get('displayName') as string;

        const { error } = await supabase
            .from('profiles')
            .update({ display_name: displayName })
            .eq('id', user.id);

        if (error) {
            alert("Error updating profile: " + error.message);
        } else {
            setProfile({ ...profile, display_name: displayName });
            alert("Profile updated successfully!");
        }
        setSaving(false);
    };

    const handleSavePin = async () => {
        if (!user) return;
        setPinError(null);
        setPinSaving(true);

        // Validate PIN
        if (newPin.length < 4 || newPin.length > 6) {
            setPinError("PIN must be 4-6 digits");
            setPinSaving(false);
            return;
        }

        if (!/^\d+$/.test(newPin)) {
            setPinError("PIN must contain only numbers");
            setPinSaving(false);
            return;
        }

        if (newPin !== confirmPin) {
            setPinError("PINs do not match");
            setPinSaving(false);
            return;
        }

        try {
            const { error } = await supabase.rpc('set_parent_pin', {
                p_user_id: user.id,
                new_pin: newPin
            });

            if (error) throw error;

            setPinEnabled(true);
            setProfile({ ...profile, pin_hash: 'set' });
            setShowPinModal(false);
            setNewPin("");
            setConfirmPin("");
            alert("PIN set successfully!");
        } catch (err: any) {
            console.error("Error setting PIN:", err);
            setPinError(err.message || "Failed to set PIN");
        } finally {
            setPinSaving(false);
        }
    };

    const handleRemovePin = async () => {
        if (!user) return;
        if (!confirm("Are you sure you want to remove your PIN? Anyone with your email/password will be able to access your account.")) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ pin_hash: null, pin_salt: null })
                .eq('id', user.id);

            if (error) throw error;

            setPinEnabled(false);
            setProfile({ ...profile, pin_hash: null, pin_salt: null });
            alert("PIN removed successfully!");
        } catch (err: any) {
            console.error("Error removing PIN:", err);
            alert("Failed to remove PIN: " + err.message);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !profile) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This will permanently delete:\n\n" +
            "- Your profile and account\n" +
            "- All children and their data\n" +
            "- All tasks and task history\n" +
            "- All rewards and redemptions\n" +
            "- All progress data (XP, levels, time bank)\n\n" +
            "This action CANNOT be undone."
        );
        if (!confirmed) return;

        const typed = window.prompt("Type 'DELETE' to confirm account deletion:");
        if (typed !== 'DELETE') {
            alert("Deletion cancelled. Account not deleted.");
            return;
        }

        setDeleting(true);
        try {
            // Get family_id before deletion
            const familyId = profile.family_id;

            // Delete all children in family (soft delete)
            const { error: childrenError } = await supabase
                .from('children')
                .update({ deleted_at: new Date().toISOString() })
                .eq('family_id', familyId);

            if (childrenError) throw childrenError;

            // Delete profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Sign out
            await supabase.auth.signOut();

            // Redirect to home
            window.location.href = '/';
        } catch (err: any) {
            console.error("Error deleting account:", err);
            alert("Failed to delete account. Please contact support: support@taskfortime.com");
            setDeleting(false);
        }
    };

    if (loading) return <div>Loading account...</div>;

    return (
        <section className="space-y-6" id="my-account">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <span className="material-symbols-outlined">person</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Account</h2>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0">
                        <AppAvatar
                            userId={user?.id || 'parent'}
                            name={profile?.display_name}
                            size={96}
                            style="notionists"
                            className="border-4 border-white dark:border-gray-700 shadow-sm"
                        />
                    </div>
                    <div className="flex-1 w-full space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Full Name
                                    {profile?.is_owner && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full font-bold">
                                            <span className="material-symbols-outlined text-[12px]">star</span>
                                            Owner
                                        </span>
                                    )}
                                </label>
                                <input
                                    name="displayName"
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-primary focus:border-primary"
                                    type="text"
                                    defaultValue={profile?.display_name || ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                <input
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-primary focus:border-primary disabled:opacity-50"
                                    type="email"
                                    defaultValue={user?.email || ""}
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-primary text-teal-900 font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                        {/* PIN Section */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    Account PIN
                                    {pinEnabled && (
                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                            Active
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {pinEnabled
                                        ? "A 4-6 digit PIN is required when logging in"
                                        : "Add a PIN for extra security when logging in"
                                    }
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {pinEnabled && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePin}
                                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewPin("");
                                        setConfirmPin("");
                                        setPinError(null);
                                        setShowPinModal(true);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {pinEnabled ? "Change PIN" : "Set PIN"}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Password</span>
                                <span className="text-xs text-gray-500">Security managed via Supabase Auth</span>
                            </div>
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowPinModal(false)}></div>
                    <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {pinEnabled ? "Change PIN" : "Set Account PIN"}
                            </h2>
                            <button
                                onClick={() => setShowPinModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Your PIN will be required when logging into your account. Use 4-6 digits.
                        </p>

                        {pinError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                                {pinError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    New PIN (4-6 digits)
                                </label>
                                <div className="flex gap-2 justify-center">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={newPin[index] || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                const pin = newPin.split('');
                                                pin[index] = value;
                                                setNewPin(pin.join(''));

                                                if (value && index < 5) {
                                                    const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                                    nextInput?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !newPin[index] && index > 0) {
                                                    const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                                                    prevInput?.focus();
                                                }
                                            }}
                                            className="w-10 h-12 text-center text-lg font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Confirm PIN
                                </label>
                                <div className="flex gap-2 justify-center">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={confirmPin[index] || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                const pin = confirmPin.split('');
                                                pin[index] = value;
                                                setConfirmPin(pin.join(''));

                                                if (value && index < 5) {
                                                    const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                                    nextInput?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !confirmPin[index] && index > 0) {
                                                    const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                                                    prevInput?.focus();
                                                }
                                            }}
                                            className="w-10 h-12 text-center text-lg font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePin}
                                    disabled={pinSaving || newPin.length < 4}
                                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-teal-900 font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {pinSaving ? "Saving..." : "Save PIN"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Deletion Section */}
            <section className="mt-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    Delete Account & Data
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {deleting ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                            Delete My Account
                        </>
                    )}
                </button>
            </section>
        </section>
    );
}
