"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { SettingsNavigation } from "./components/SettingsNavigation";
import { AccountSection } from "./components/AccountSection";
import { FamilyManagementSection } from "./components/FamilyManagementSection";
import { PrivacySection } from "./components/PrivacySection";
import { NotificationsSection } from "./components/NotificationsSection";
import { BillingSection } from "./components/BillingSection";
import { HelpSupportSection } from "./components/HelpSupportSection";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import { AppAvatar } from "@/components/AppAvatar";

const sectionTitles: Record<string, { title: string; description: string }> = {
    account: { title: 'My Account', description: 'Manage your personal information and preferences.' },
    family: { title: 'Family Management', description: 'Add and manage your children\'s profiles.' },
    billing: { title: 'Plan & Billing', description: 'View your current plan and billing status.' },
    notifications: { title: 'Notifications', description: 'Control how and when you receive notifications.' },
    privacy: { title: 'Privacy & Security', description: 'Manage your privacy settings and security options.' },
    support: { title: 'Help & Support', description: 'Get help and find resources.' },
};

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState('account');
    const [displayName, setDisplayName] = useState("Parent");
    const [userId, setUserId] = useState<string>("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Read initial section from URL query parameter
    useEffect(() => {
        const section = searchParams.get('section');
        if (section && sectionTitles[section]) {
            setActiveSection(section);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();
                if (data?.display_name) {
                    setDisplayName(data.display_name);
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        // Update URL without full navigation
        router.push(`/parent/settings?section=${section}`, { scroll: false });
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'account':
                return <AccountSection />;
            case 'family':
                return <FamilyManagementSection />;
            case 'billing':
                return <BillingSection />;
            case 'notifications':
                return <NotificationsSection />;
            case 'privacy':
                return <PrivacySection />;
            case 'support':
                return <HelpSupportSection />;
            default:
                return <AccountSection />;
        }
    };

    const currentSection = sectionTitles[activeSection] || sectionTitles.account;

    return (
        <ChildModeGuard>
            <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
                <ParentSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50/50 dark:bg-background-dark">
                    <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <AppAvatar userId={userId || 'parent'} name={displayName} size={32} style="notionists" className="rounded-lg" />
                            <span className="font-bold">Task For Time</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-text-main-light dark:text-text-main-dark transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <SettingsNavigation
                            activeSection={activeSection}
                            onSectionChange={handleSectionChange}
                        />

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth">
                            <div className="max-w-3xl mx-auto pb-20">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-black text-teal-900 dark:text-white tracking-tight">
                                        {currentSection.title}
                                    </h1>
                                    <p className="text-text-sub-light dark:text-text-sub-dark mt-2">
                                        {currentSection.description}
                                    </p>
                                </div>

                                {renderSection()}

                                <div className="h-10"></div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ChildModeGuard>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse text-teal-900 dark:text-white">Loading settings...</p>
                </div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
