"use client";

import Link from "next/link";
import { FooterSection } from "../components/FooterSection";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { enterChildMode, clearAllSessionData } from "@/lib/child-session";
import { ChildAvatar } from "@/components/ChildAvatar";

type Child = Database['public']['Tables']['children']['Row'];

interface AccountOption {
    type: 'parent' | 'child';
    id: string;
    name: string;
    childId?: string;
    hasPin?: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Account selection state
    const [showAccountSelection, setShowAccountSelection] = useState(false);
    const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
    const [familyChildren, setFamilyChildren] = useState<Child[]>([]);

    // PIN verification state
    const [showPinEntry, setShowPinEntry] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(null);
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);
    const [pinAttempts, setPinAttempts] = useState(0);
    const [isRateLimited, setIsRateLimited] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.user) throw new Error("No user returned");

            // Check if user has a profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, family_id, display_name, pin_hash')
                .eq('id', data.user.id)
                .single();

            if (!profile) {
                // No profile found - redirect to role selection
                router.push("/role");
                return;
            }

            // If user is a parent, check if there are children in the family
            if (profile.role === 'parent' && profile.family_id) {
                const { data: children } = await supabase
                    .from('children')
                    .select('*')
                    .eq('family_id', profile.family_id)
                    .is('deleted_at', null);

                if (children && children.length > 0) {
                    // Build account options: parent + all children
                    const options: AccountOption[] = [
                        {
                            type: 'parent',
                            id: data.user.id,
                            name: profile.display_name || 'Parent',
                            hasPin: !!profile.pin_hash
                        },
                        ...children.map((child: Child) => ({
                            type: 'child' as const,
                            id: child.id,
                            name: child.name,
                            childId: child.id,
                            hasPin: !!child.pin
                        }))
                    ];

                    setAccountOptions(options);
                    setFamilyChildren(children);
                    setShowAccountSelection(true);
                    setLoading(false);
                    return;
                }

                // Parent with no children - check if parent has PIN
                if (profile.pin_hash) {
                    setSelectedAccount({
                        type: 'parent',
                        id: data.user.id,
                        name: profile.display_name || 'Parent',
                        hasPin: true
                    });
                    setShowPinEntry(true);
                    setLoading(false);
                    return;
                }

                // No PIN required, go to dashboard
                router.push("/parent/dashboard");
                return;
            }

            // Direct navigation for child profiles
            if (profile.role === 'parent') {
                router.push("/parent/dashboard");
            } else {
                router.push("/child/dashboard");
            }
        } catch (error: any) {
            setError(error.message || "Failed to sign in");
            setLoading(false);
        }
    };

    const handleAccountSelection = (option: AccountOption) => {
        if (option.hasPin) {
            setSelectedAccount(option);
            setShowPinEntry(true);
            setPin("");
            setPinError(null);
            setPinAttempts(0);
            setIsRateLimited(false);
        } else {
            // No PIN required, proceed directly
            if (option.type === 'parent') {
                // Clear any child mode state when entering parent mode
                clearAllSessionData();
                router.push("/parent/dashboard");
            } else {
                if (option.childId) {
                    // Enter child mode - this locks the session to child-only access
                    console.log('[Login] Entering child mode for:', option.name);
                    enterChildMode(option.childId);
                }
                router.push("/child/dashboard");
            }
        }
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;

        setPinError(null);
        setLoading(true);

        try {
            let isValid = false;

            if (selectedAccount.type === 'parent') {
                // Verify parent PIN
                const { data, error } = await supabase
                    .rpc('verify_parent_pin', {
                        p_user_id: selectedAccount.id,
                        input_pin: pin
                    });

                if (error) {
                    if (error.message.includes('Too many failed attempts')) {
                        setIsRateLimited(true);
                        setPinError("Too many failed attempts. Please try again in 15 minutes.");
                        setLoading(false);
                        return;
                    }
                    throw error;
                }
                isValid = data;
            } else {
                // Verify child PIN
                const { data, error } = await supabase
                    .rpc('verify_child_pin', {
                        p_child_id: selectedAccount.childId,
                        input_pin: pin
                    });

                if (error) {
                    if (error.message.includes('Too many failed attempts')) {
                        setIsRateLimited(true);
                        setPinError("Too many failed attempts. Please ask a parent to reset your PIN.");
                        setLoading(false);
                        return;
                    }
                    throw error;
                }
                isValid = data;
            }

            if (!isValid) {
                const newAttempts = pinAttempts + 1;
                setPinAttempts(newAttempts);

                if (newAttempts >= 5) {
                    setIsRateLimited(true);
                    setPinError(selectedAccount.type === 'parent'
                        ? "Too many failed attempts. Please try again in 15 minutes."
                        : "Too many failed attempts. Please ask a parent to reset your PIN.");
                } else {
                    setPinError(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
                }
                setPin("");
                setLoading(false);
                return;
            }

            // PIN is correct, proceed to dashboard
            if (selectedAccount.type === 'parent') {
                // Clear any child mode state when entering parent mode
                clearAllSessionData();
                router.push("/parent/dashboard");
            } else {
                if (selectedAccount.childId) {
                    // Enter child mode - this locks the session to child-only access
                    console.log('[Login] Entering child mode (via PIN) for:', selectedAccount.name);
                    enterChildMode(selectedAccount.childId);
                }
                router.push("/child/dashboard");
            }
        } catch (err: any) {
            console.error("Error verifying PIN:", err);
            setPinError("Failed to verify PIN. Please try again.");
            setLoading(false);
        }
    };

    const handleBackToAccounts = () => {
        setShowPinEntry(false);
        setSelectedAccount(null);
        setPin("");
        setPinError(null);
        setPinAttempts(0);
        setIsRateLimited(false);
    };

    const handleBackToLogin = async () => {
        // Sign out and reset to login form
        await supabase.auth.signOut();
        setShowAccountSelection(false);
        setShowPinEntry(false);
        setAccountOptions([]);
        setSelectedAccount(null);
        setEmail("");
        setPassword("");
        setPin("");
        setPinAttempts(0);
        setIsRateLimited(false);
    };

    const handleForgotPin = () => {
        if (selectedAccount?.type === 'child') {
            alert("Please ask your parent to reset your PIN from their account settings.");
        } else {
            // For parent, could implement email recovery here
            alert("Please contact support or use password recovery to reset your account.");
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="text-primary cursor-pointer">
                                <span className="material-symbols-outlined text-3xl">diversity_3</span>
                            </Link>
                            <h2 className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</h2>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center py-20 px-4">
                {showPinEntry ? (
                    // PIN Entry Screen
                    <div className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8 flex flex-col items-center">
                            <ChildAvatar
                                childId={selectedAccount?.id || 'parent'}
                                childName={selectedAccount?.name || 'Parent'}
                                size={64}
                                className="mb-4"
                                style={selectedAccount?.type === 'parent' ? 'notionists' : 'adventurer'}
                            />
                            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">Enter PIN</h1>
                            <p className="text-text-sub dark:text-gray-400">
                                Enter your {selectedAccount?.type === 'parent' ? '4-6' : '4'}-digit PIN to continue as {selectedAccount?.name}
                            </p>
                        </div>

                        {pinError && (
                            <div className={`mb-4 p-3 rounded-lg text-sm font-medium text-center ${isRateLimited
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                }`}>
                                {pinError}
                            </div>
                        )}

                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {[0, 1, 2, 3].map((index) => (
                                    <input
                                        key={index}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        id={`pin-digit-${index}`}
                                        name={`pin-digit-${index}`}
                                        autoComplete="off"
                                        value={pin[index] || ''}
                                        disabled={isRateLimited}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            const newPin = pin.split('');
                                            newPin[index] = value;
                                            setPin(newPin.join(''));

                                            // Auto-focus next input
                                            if (value && index < 3) {
                                                const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                                nextInput?.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Handle backspace to go to previous input
                                            if (e.key === 'Backspace' && !pin[index] && index > 0) {
                                                const prevInput = (e.target as HTMLElement).parentElement?.children[index - 1] as HTMLInputElement;
                                                prevInput?.focus();
                                            }
                                        }}
                                        className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || pin.length < 4 || isRateLimited}
                                className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-text-main shadow-md hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Verifying..." : "Continue"}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-2">
                            <button
                                onClick={handleForgotPin}
                                className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary-dark transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[18px]">help</span>
                                Forgot PIN?
                            </button>
                            {accountOptions.length > 0 && (
                                <button
                                    onClick={handleBackToAccounts}
                                    className="w-full flex items-center justify-center gap-2 text-text-sub dark:text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                    Choose different account
                                </button>
                            )}
                            <button
                                onClick={handleBackToLogin}
                                className="w-full flex items-center justify-center gap-2 text-text-sub dark:text-gray-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Sign in with different account
                            </button>
                        </div>
                    </div>
                ) : showAccountSelection ? (
                    // Account Selection Screen
                    <div className="w-full max-w-lg bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">Who&apos;s using Task For Time?</h1>
                            <p className="text-text-sub dark:text-gray-400">Select your profile to continue</p>
                        </div>

                        <div className="grid gap-4">
                            {accountOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleAccountSelection(option)}
                                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
                                >
                                    <ChildAvatar
                                        childId={option.id}
                                        childName={option.name}
                                        size={56}
                                        style={option.type === 'parent' ? 'notionists' : 'adventurer'}
                                    />
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                                            {option.name}
                                        </h3>
                                        <p className="text-sm text-text-sub dark:text-gray-400 flex items-center gap-1">
                                            {option.type === 'parent' ? 'Parent Account' : 'Child Account'}
                                            {option.hasPin && (
                                                <span className="inline-flex items-center gap-1 text-xs text-primary">
                                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                                    PIN Protected
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">
                                        arrow_forward
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleBackToLogin}
                            className="w-full mt-6 flex items-center justify-center gap-2 text-text-sub dark:text-gray-400 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sign in with a different account
                        </button>
                    </div>
                ) : (
                    // Login Form
                    <div className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">Welcome Back</h1>
                            <p className="text-text-sub dark:text-gray-400">Sign in to your family account</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleLogin}>
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-medium text-text-main dark:text-white mb-1">Email</label>
                                <input
                                    type="email"
                                    id="login-email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-primary focus:border-primary"
                                    placeholder="parent@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="login-password" className="block text-sm font-medium text-text-main dark:text-white mb-1">Password</label>
                                <input
                                    type="password"
                                    id="login-password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-primary focus:border-primary"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-text-main shadow-md hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-text-sub dark:text-gray-400">
                            Don&apos;t have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Get Started</Link>
                        </div>
                    </div>
                )}
            </main>

            <FooterSection />
        </div>
    );
}
