"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AddChildModalProps {
    familyId: string;
    isOpen: boolean;
    onClose: () => void;
    onChildAdded: () => void;
}

export function AddChildModal({ familyId, isOpen, onClose, onChildAdded }: AddChildModalProps) {
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [enablePin, setEnablePin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!name.trim()) {
            setError("Please enter a name");
            setLoading(false);
            return;
        }

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
            const { error: insertError } = await supabase
                .from('children')
                .insert({
                    family_id: familyId,
                    name: name.trim(),
                    level: 1,
                    xp: 0,
                    time_bank_minutes: 0,
                    pin: enablePin ? pin : null
                });

            if (insertError) throw insertError;

            setName("");
            setPin("");
            setEnablePin(false);
            onChildAdded();
            onClose();
        } catch (err: any) {
            console.error("Error adding child:", err);
            setError(err.message || "Failed to add child");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName("");
        setPin("");
        setEnablePin(false);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">Add a Child</h2>
                    <button
                        onClick={handleClose}
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
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors"></div>
                            <img
                                src={`https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(name || 'preview')}&size=80&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                alt="Avatar Preview"
                                className="relative w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-lg object-cover bg-gray-50 dark:bg-gray-800"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-md">
                                <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                            </div>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-primary mt-2">Avatar Preview</p>
                    </div>

                    <div>
                        <label htmlFor="childName" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                            Child's Name
                        </label>
                        <input
                            type="text"
                            id="childName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Enter child's name"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="pt-2">
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
                                    Set a PIN for this child
                                </span>
                                <p className="text-xs text-text-sub-light dark:text-gray-400">
                                    Require a 4-digit PIN when switching to this child's account
                                </p>
                            </div>
                        </label>
                    </div>

                    {enablePin && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label htmlFor="childPin" className="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1">
                                4-Digit PIN
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
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-text-sub-light dark:text-gray-400 text-center mt-2">
                                This PIN will be required to access {name || "this child"}'s account
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-text-main-light dark:text-text-main-dark font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (enablePin && pin.length !== 4)}
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-text-main-light font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add Child"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
