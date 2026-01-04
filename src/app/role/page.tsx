"use client";

import Link from "next/link";
import { FooterSection } from "../components/FooterSection";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function RolePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                router.push("/login");
                return;
            }

            setUserId(user.id);

            // Check if profile already exists
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                // PGRST116 is "not found" - that's okay, we'll create one
                console.error('Error checking profile:', profileError);
            }

            if (profile) {
                setProfile(profile);
                // Redirect to appropriate dashboard
                if (profile.role === 'parent') {
                    router.push('/parent/dashboard');
                } else if (profile.role === 'child') {
                    router.push('/child/dashboard');
                }
            }
            setLoading(false);
        };

        checkUser();
    }, [router]);

    const handleRoleSelection = async (role: 'parent' | 'child') => {
        if (!userId || creating) return;

        setCreating(true);

        try {
            // Verify user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error('Auth error:', authError);
                throw new Error('Not authenticated. Please log in again.');
            }

            console.log('[Role] Creating profile via API for user:', user.id);

            // Use server-side API to create profile (bypasses RLS issues)
            const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    role: role,
                    displayName: role === 'parent' ? 'Parent' : 'Child'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create profile');
            }

            console.log('[Role] Profile created successfully');

            // Redirect to the appropriate dashboard
            if (role === 'parent') {
                router.push('/parent/dashboard');
            } else {
                router.push('/child/dashboard');
            }
        } catch (error: any) {
            console.error('[Role] Error creating profile:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            alert('Failed to create profile: ' + errorMessage);
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

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
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-4">Who are you?</h1>
                        <p className="text-lg text-text-sub dark:text-gray-400">Select your profile to continue</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <button
                            onClick={() => handleRoleSelection('parent')}
                            disabled={creating}
                            className="group bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-glow transition-all flex flex-col items-center text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-5xl text-primary">face</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
                                {creating ? 'Creating...' : 'Parent'}
                            </h3>
                            <p className="text-sm text-text-sub dark:text-gray-400">Manage tasks, approve requests, and set settings.</p>
                        </button>

                        <button
                            onClick={() => handleRoleSelection('child')}
                            disabled={creating}
                            className="group bg-white dark:bg-card-dark p-8 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-glow transition-all flex flex-col items-center text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-5xl text-teal-600 dark:text-teal-400">child_care</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
                                {creating ? 'Creating...' : 'Child'}
                            </h3>
                            <p className="text-sm text-text-sub dark:text-gray-400">View tasks, submit work, and check your time bank.</p>
                        </button>
                    </div>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}
