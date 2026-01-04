"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AddChildModal } from "../../components/AddChildModal";
import { ChildAvatar } from "@/components/ChildAvatar";
import { exitChildMode, getActiveChildId } from "@/lib/child-session";

interface EditPinModalProps {
    childId: string;
    childName: string;
    hasPin: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

function EditPinModal({ childId, childName, hasPin, isOpen, onClose, onSaved }: EditPinModalProps) {
    const [pin, setPin] = useState("");
    const [enablePin, setEnablePin] = useState(hasPin);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setEnablePin(hasPin);
        setPin("");
    }, [hasPin, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (enablePin && pin.length !== 4) {
            setError("PIN must be exactly 4 digits");
            setLoading(false);
            return;
        }

        if (enablePin && !/^\d{4}$/.test(pin)) {
            setError("PIN must contain only numbers");
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from('children')
                .update({ pin: enablePin ? pin : null })
                .eq('id', childId);

            if (updateError) throw updateError;

            onSaved();
            onClose();
        } catch (err: any) {
            console.error("Error updating PIN:", err);
            setError(err.message || "Failed to update PIN");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                        {hasPin ? "Update" : "Set"} PIN for {childName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enablePin}
                                onChange={(e) => {
                                    setEnablePin(e.target.checked);
                                    if (!e.target.checked) setPin("");
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                                <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
                                    Require PIN to access this account
                                </span>
                                <p className="text-xs text-text-sub-light dark:text-gray-400">
                                    {enablePin ? "A 4-digit PIN will be required when switching to this child's account" : "Anyone can access this account without a PIN"}
                                </p>
                            </div>
                        </label>
                    </div>

                    {enablePin && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-2">
                                {hasPin ? "Enter New 4-Digit PIN" : "Enter 4-Digit PIN"}
                            </label>
                            <div className="flex gap-2 justify-center">
                                {[0, 1, 2, 3].map((index) => (
                                    <input
                                        key={index}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={pin[index] || ''}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            const newPin = pin.split('');
                                            newPin[index] = value;
                                            setPin(newPin.join(''));

                                            if (value && index < 3) {
                                                const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                                nextInput?.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !pin[index] && index > 0) {
                                                const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                                                prevInput?.focus();
                                            }
                                        }}
                                        className="w-14 h-14 text-center text-xl font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (enablePin && pin.length !== 4)}
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function FamilyManagementSection() {
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [showAddChild, setShowAddChild] = useState(false);
    const [editingPinChild, setEditingPinChild] = useState<{ id: string; name: string; hasPin: boolean } | null>(null);

    const fetchChildren = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('family_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            setFamilyId(profile.family_id);
            const { data } = await supabase
                .from('children')
                .select('*')
                .eq('family_id', profile.family_id)
                .is('deleted_at', null);

            setChildren(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    const handleDeleteChild = async (childId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name}? This will preserve their historical data but hide them from the dashboard.`)) {
            return;
        }

        const { error } = await supabase
            .from('children')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', childId);

        if (error) {
            alert("Error deleting child: " + error.message);
        } else {
            // Clear child session if this child is currently active
            const activeChildId = getActiveChildId();
            if (activeChildId === childId) {
                exitChildMode();
                // Redirect to login/choose profile
                window.location.href = '/login';
            }

            setChildren(children.filter(c => c.id !== childId));
        }
    };

    const handleUnlockChild = async (childId: string, name: string) => {
        if (!confirm(`Clear PIN lockout for ${name}? This will allow them to try entering their PIN again.`)) {
            return;
        }

        try {
            const { error } = await supabase.rpc('clear_pin_rate_limit', {
                p_child_id: childId
            });

            if (error) throw error;
            alert(`${name}'s PIN lockout has been cleared.`);
        } catch (err: any) {
            console.error("Error clearing lockout:", err);
            alert("Failed to clear lockout: " + err.message);
        }
    };

    if (loading) return <div>Loading family...</div>;

    return (
        <section className="space-y-6" id="family-management">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Family Management</h2>
                </div>
                <button
                    onClick={() => setShowAddChild(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-teal-900 font-bold text-sm rounded-lg hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add New Child
                </button>
            </div>
            <div className="grid gap-4">
                {children.length === 0 ? (
                    <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">child_care</span>
                        <p className="text-gray-500 mb-4">No children profiles found. Add your first child to get started!</p>
                        <button
                            onClick={() => setShowAddChild(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-teal-900 font-bold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Your First Child
                        </button>
                    </div>
                ) : (
                    children.map((child) => (
                        <div key={child.id} className="bg-card-light dark:bg-card-dark rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <ChildAvatar
                                    childId={child.id}
                                    childName={child.name}
                                    size={48}
                                    className="border-2 border-primary/30 shadow-sm bg-gray-100 dark:bg-gray-800"
                                    style="adventurer"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{child.name}</h3>
                                        {child.pin && (
                                            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                                PIN
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Level {child.level} • {child.xp} XP • {Math.floor(child.time_bank_minutes / 60)}h {child.time_bank_minutes % 60}m in bank</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setEditingPinChild({ id: child.id, name: child.name, hasPin: !!child.pin })}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{child.pin ? 'lock' : 'lock_open'}</span>
                                    {child.pin ? 'Edit PIN' : 'Set PIN'}
                                </button>
                                <button
                                    onClick={() => handleUnlockChild(child.id, child.name)}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors rounded-lg"
                                    title="Clear PIN lockout if child is locked out"
                                >
                                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                                    Unlock
                                </button>
                                <button
                                    onClick={() => handleDeleteChild(child.id, child.name)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {familyId && (
                <AddChildModal
                    familyId={familyId}
                    isOpen={showAddChild}
                    onClose={() => setShowAddChild(false)}
                    onChildAdded={fetchChildren}
                />
            )}

            {editingPinChild && (
                <EditPinModal
                    childId={editingPinChild.id}
                    childName={editingPinChild.name}
                    hasPin={editingPinChild.hasPin}
                    isOpen={true}
                    onClose={() => setEditingPinChild(null)}
                    onSaved={fetchChildren}
                />
            )}
        </section>
    );
}
