"use client";

interface SettingsNavigationProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const sections = [
    { id: 'account', label: 'My Account', icon: 'person', group: 'Account' },
    { id: 'family', label: 'Family Management', icon: 'group', group: 'Account' },
    { id: 'billing', label: 'Plan & Billing', icon: 'credit_card', group: 'Account' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications', group: 'Preferences' },
    { id: 'privacy', label: 'Privacy & Security', icon: 'lock', group: 'Preferences' },
    { id: 'support', label: 'Help & Support', icon: 'help', group: 'Support' },
];

export function SettingsNavigation({ activeSection, onSectionChange }: SettingsNavigationProps) {
    const groupedSections = sections.reduce((acc, section) => {
        if (!acc[section.group]) {
            acc[section.group] = [];
        }
        acc[section.group].push(section);
        return acc;
    }, {} as Record<string, typeof sections>);

    return (
        <div className="w-64 hidden lg:block bg-card-light dark:bg-card-dark border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
            <div className="p-6">
                {Object.entries(groupedSections).map(([group, items]) => (
                    <div key={group} className="mb-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{group}</h2>
                        <ul className="space-y-1">
                            {items.map((section) => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => onSectionChange(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                            activeSection === section.id
                                                ? 'bg-teal-50 text-teal-900 dark:bg-gray-800 dark:text-white font-semibold'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] ${activeSection === section.id ? 'fill-1' : ''}`}>
                                            {section.icon}
                                        </span>
                                        {section.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
