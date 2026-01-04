"use client";

import Link from "next/link";
import { FooterSection } from "../components/FooterSection";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            // Use server-side API to create account (bypasses RLS issues)
            console.log('[Signup] Calling signup API...');
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account');
            }

            console.log('[Signup] Account created, signing in...');

            // Now sign in the user
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error('[Signup] Sign in error:', signInError);
                throw new Error(signInError.message || 'Account created but failed to sign in. Please go to login page.');
            }

            console.log('[Signup] Signed in successfully, redirecting...');
            router.push("/parent/dashboard");
        } catch (error: any) {
            console.error('[Signup] Error:', error);
            const errorMessage = error?.message || "Failed to create account. Please try again.";
            setError(errorMessage);
            setLoading(false);
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
                <div className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">Get Started</h1>
                        <p className="text-text-sub dark:text-gray-400">Create your family account</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSignup}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-main dark:text-white mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="parent@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-main dark:text-white mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-main dark:text-white mb-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-main dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-text-main shadow-md hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-text-sub dark:text-gray-400">
                        Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                    </div>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}

