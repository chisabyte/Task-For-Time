"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { FooterSection } from "../components/FooterSection";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function PrivacyPage() {
    const router = useRouter();
    const [homeLink, setHomeLink] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                // Not authenticated - link to landing page
                setHomeLink("/");
                setIsCheckingAuth(false);
                return;
            }

            // User is authenticated - check their profile to determine dashboard route
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Link to appropriate dashboard based on role
                if (profile.role === 'parent') {
                    setHomeLink("/parent/dashboard");
                } else if (profile.role === 'child') {
                    setHomeLink("/child/dashboard");
                } else {
                    // Fallback to landing page if role is unknown
                    setHomeLink("/");
                }
            } else {
                // Authenticated but no profile - link to role selection
                setHomeLink("/role");
            }
            setIsCheckingAuth(false);
        };

        checkAuth();
    }, []);

    const handleNavigateHome = () => {
        if (homeLink) {
            router.push(homeLink);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button 
                            onClick={handleNavigateHome}
                            disabled={isCheckingAuth || !homeLink}
                            className="flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
                            <h2 className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</h2>
                        </button>
                        <button 
                            onClick={handleNavigateHome}
                            disabled={isCheckingAuth || !homeLink}
                            className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-none">
                    <h1 className="text-4xl font-black text-text-main dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-sm text-text-sub dark:text-gray-400 mb-12">Last updated: 04 January 2026</p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">What We Collect</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            Task For Time collects only the information required to operate the service:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 mb-4 leading-relaxed">
                            <li><strong>Account Information:</strong> Parent email address, display name, authentication credentials (managed securely)</li>
                            <li><strong>Family Data:</strong> Family name, children's names, optional avatars</li>
                            <li><strong>Task Data:</strong> Tasks created, completion status, timestamps</li>
                            <li><strong>Progress Data:</strong> Experience points (XP), levels, and time-based reward balances</li>
                            <li><strong>Reward Data:</strong> Rewards created and redeemed within the app</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Children's Data</h2>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>Task For Time is designed for use by parents.</li>
                            <li>Children do not create independent accounts.</li>
                            <li>All child profiles are created and managed by a parent or legal guardian</li>
                            <li>Children's data is visible only to their family</li>
                            <li>We do not use children's data for advertising, profiling, or marketing</li>
                            <li>Parents may edit or delete child data at any time</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Why We Collect It</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            We use your information solely to:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>Provide and operate the Task For Time service</li>
                            <li>Enable task assignment, approvals, and reward tracking</li>
                            <li>Maintain progress and history for family accountability</li>
                            <li>Send essential service-related notifications (if enabled)</li>
                            <li>Improve product reliability and usability</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Storage & Security</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            Your data is protected using industry-standard practices:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>Data is stored in Supabase (PostgreSQL) with encryption at rest</li>
                            <li>All network communication uses HTTPS</li>
                            <li>Authentication and password security are handled by Supabase Auth</li>
                            <li>Row-Level Security (RLS) enforces strict data isolation between families</li>
                            <li>Access to production data is restricted and monitored</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Sharing</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            We do not sell, rent, or trade your personal data.
                        </p>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            We only share data:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>With infrastructure providers required to operate the service (e.g. Supabase)</li>
                            <li>When legally required or to protect our legal rights</li>
                        </ul>
                        <p className="text-text-sub dark:text-gray-300 mt-4 leading-relaxed">
                            We never share data with advertisers or third-party marketers.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Data Retention</h2>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>Your data is retained only while your account is active</li>
                            <li>Deleting your account permanently removes associated family and task data</li>
                            <li>Backup data is retained only as long as required for system integrity</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Your Rights</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 text-text-sub dark:text-gray-300 space-y-2 leading-relaxed">
                            <li>Access your account and family data</li>
                            <li>Correct inaccurate information</li>
                            <li>Export your data in a portable format</li>
                            <li>Delete your account and associated data at any time</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Changes to This Policy</h2>
                        <p className="text-text-sub dark:text-gray-300 leading-relaxed">
                            If we make material changes to this policy, we will notify users through the app or via email.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Contact</h2>
                        <p className="text-text-sub dark:text-gray-300 mb-4 leading-relaxed">
                            For questions about this privacy policy or data practices, contact:
                        </p>
                        <p className="text-text-sub dark:text-gray-300 leading-relaxed">
                            📧 <a href="mailto:roscoechisas@gmail.com" className="text-primary hover:underline">roscoechisas@gmail.com</a>
                        </p>
                    </section>
                </article>
            </main>

            <FooterSection />
        </div>
    );
}

