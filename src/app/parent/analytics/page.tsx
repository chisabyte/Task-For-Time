"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { ParentSidebar } from "../components/ParentSidebar";
import { ChildModeGuard } from "@/components/ChildModeGuard";
import { PremiumGate } from "@/components/PremiumGate";
import { AppAvatar } from "@/components/AppAvatar";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Child = Database['public']['Tables']['children']['Row'];
type AssignedTask = Database['public']['Tables']['assigned_tasks']['Row'];

// Types for analytics
type TimeRange = 'this_week' | 'last_week' | 'last_30_days' | 'custom';

interface DateRange {
    start: Date;
    end: Date;
}

interface KPIData {
    value: number;
    prevValue: number;
    delta: number;
    deltaPct: number;
    trend: 'up' | 'down' | 'flat';
}

interface DailyData {
    date: Date;
    dayName: string;
    tasksCompleted: number;
    minutesEarned: number;
    minutesRedeemed: number;
    metGoal: boolean;
}

interface ChildAnalytics {
    child: Child;
    // Period stats
    assignedCount: number;
    activeCount: number;
    submittedCount: number;
    approvedCount: number;
    completionRate: number;
    // Consistency (last 7 days)
    consistencyDaysActive: number;
    consistencyBand: 'green' | 'yellow' | 'red';
    // Momentum (last 7 days vs prior 7 days)
    momentumDelta: number;
    momentumLabel: 'improving' | 'stable' | 'declining';
    // Time
    minutesEarned: number;
    minutesRedeemed: number;
}

type LeaderboardMetric = 'minutesEarned' | 'approvedCount' | 'consistencyDaysActive';

interface ChartInsight {
    bestDay: string | null;
    missedGoalDays: string[];
    goalMetCount: number;
    totalDays: number;
}

// Utility functions
function getDateRange(range: TimeRange, customStart?: Date, customEnd?: Date): { current: DateRange; previous: DateRange } {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    switch (range) {
        case 'this_week': {
            // Start from Sunday of current week
            const dayOfWeek = now.getDay();
            currentStart = new Date(now);
            currentStart.setDate(now.getDate() - dayOfWeek);
            currentStart.setHours(0, 0, 0, 0);
            currentEnd = new Date(now);

            prevEnd = new Date(currentStart);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 6);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case 'last_week': {
            const dayOfWeek = now.getDay();
            currentEnd = new Date(now);
            currentEnd.setDate(now.getDate() - dayOfWeek - 1);
            currentEnd.setHours(23, 59, 59, 999);
            currentStart = new Date(currentEnd);
            currentStart.setDate(currentStart.getDate() - 6);
            currentStart.setHours(0, 0, 0, 0);

            prevEnd = new Date(currentStart);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 6);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case 'last_30_days': {
            currentEnd = new Date(now);
            currentStart = new Date(now);
            currentStart.setDate(currentStart.getDate() - 29);
            currentStart.setHours(0, 0, 0, 0);

            prevEnd = new Date(currentStart);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 29);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case 'custom': {
            if (customStart && customEnd) {
                currentStart = new Date(customStart);
                currentStart.setHours(0, 0, 0, 0);
                currentEnd = new Date(customEnd);
                currentEnd.setHours(23, 59, 59, 999);

                const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
                prevEnd = new Date(currentStart);
                prevEnd.setDate(prevEnd.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
                prevStart = new Date(prevEnd);
                prevStart.setDate(prevStart.getDate() - daysDiff + 1);
                prevStart.setHours(0, 0, 0, 0);
            } else {
                // Fallback to this week
                return getDateRange('this_week');
            }
            break;
        }
    }

    return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: prevStart, end: prevEnd }
    };
}

function isDateInRange(date: Date | string, range: DateRange): boolean {
    const d = new Date(date);
    return d >= range.start && d <= range.end;
}

function calculateKPI(current: number, previous: number): KPIData {
    const delta = current - previous;
    const deltaPct = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0);
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (delta > 0) trend = 'up';
    else if (delta < 0) trend = 'down';

    return { value: current, prevValue: previous, delta, deltaPct, trend };
}

function getConsistencyBand(daysActive: number): 'green' | 'yellow' | 'red' {
    if (daysActive >= 5) return 'green';
    if (daysActive >= 2) return 'yellow';
    return 'red';
}

function getMomentumLabel(delta: number): 'improving' | 'stable' | 'declining' {
    if (delta > 0) return 'improving';
    if (delta < 0) return 'declining';
    return 'stable';
}

// Default daily goal: 1 task per day
const DAILY_TASK_GOAL = 1;

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
    const [redemptions, setRedemptions] = useState<Database['public']['Tables']['reward_redemptions']['Row'][]>([]);

    // Filters
    const [timeRange, setTimeRange] = useState<TimeRange>('this_week');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [selectedChildId, setSelectedChildId] = useState<string>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [userName, setUserName] = useState("Parent");

    // Leaderboard metric
    const [leaderboardMetric, setLeaderboardMetric] = useState<LeaderboardMetric>('minutesEarned');

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profileData || profileData.role !== 'parent') {
            router.push("/parent/dashboard");
            return;
        }

        setProfile(profileData);
        setUserId(user.id);
        setUserName(profileData.display_name || "Parent");

        // Fetch children
        const { data: childrenData } = await supabase
            .from('children')
            .select('*')
            .eq('family_id', profileData.family_id)
            .is('deleted_at', null);

        if (!childrenData || childrenData.length === 0) {
            setLoading(false);
            return;
        }

        setChildren(childrenData);

        // Fetch all assigned tasks (we'll filter by date in memory)
        const { data: tasksData } = await supabase
            .from('assigned_tasks')
            .select('*')
            .eq('family_id', profileData.family_id);

        // Fetch reward redemptions
        const { data: redemptionsData } = await supabase
            .from('reward_redemptions')
            .select('*')
            .eq('family_id', profileData.family_id);

        // Filter data by active children only
        if (tasksData || redemptionsData) {
            const activeChildIds = new Set(childrenData.map((c: Child) => c.id));

            if (tasksData) {
                const activeTasks = tasksData.filter((t: AssignedTask) => activeChildIds.has(t.child_id));
                setAssignedTasks(activeTasks);
            } else {
                setAssignedTasks([]);
            }

            if (redemptionsData) {
                const activeRedemptions = redemptionsData.filter((r: any) => activeChildIds.has(r.child_id));
                setRedemptions(activeRedemptions);
            } else {
                setRedemptions([]);
            }
        } else {
            setAssignedTasks([]);
            setRedemptions([]);
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();

        // Set up real-time subscription
        const channel = supabase
            .channel('analytics-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_tasks' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    // Calculate date ranges
    const dateRanges = useMemo(() => {
        const customStart = customStartDate ? new Date(customStartDate) : undefined;
        const customEnd = customEndDate ? new Date(customEndDate) : undefined;
        return getDateRange(timeRange, customStart, customEnd);
    }, [timeRange, customStartDate, customEndDate]);

    // Filter tasks by selected child
    const filteredTasks = useMemo(() => {
        if (selectedChildId === 'all') return assignedTasks;
        return assignedTasks.filter(t => t.child_id === selectedChildId);
    }, [assignedTasks, selectedChildId]);

    // Filter redemptions by selected child
    const filteredRedemptions = useMemo(() => {
        if (selectedChildId === 'all') return redemptions;
        return redemptions.filter(r => r.child_id === selectedChildId);
    }, [redemptions, selectedChildId]);

    // Calculate KPIs
    const kpis = useMemo(() => {
        // Current period
        const currentAssigned = filteredTasks.filter(t => isDateInRange(t.created_at, dateRanges.current));
        const currentCompleted = filteredTasks.filter(t => t.status === 'approved' && isDateInRange(t.created_at, dateRanges.current));
        const currentMinutesEarned = currentCompleted.reduce((sum, t) => sum + t.reward_minutes, 0);
        const currentRedemptions = filteredRedemptions.filter(r => isDateInRange(r.created_at, dateRanges.current));
        const currentMinutesRedeemed = currentRedemptions.reduce((sum, r) => sum + r.minutes_spent, 0);

        // Previous period
        const prevAssigned = filteredTasks.filter(t => isDateInRange(t.created_at, dateRanges.previous));
        const prevCompleted = filteredTasks.filter(t => t.status === 'approved' && isDateInRange(t.created_at, dateRanges.previous));
        const prevMinutesEarned = prevCompleted.reduce((sum, t) => sum + t.reward_minutes, 0);
        const prevRedemptions = filteredRedemptions.filter(r => isDateInRange(r.created_at, dateRanges.previous));
        const prevMinutesRedeemed = prevRedemptions.reduce((sum, r) => sum + r.minutes_spent, 0);

        return {
            totalTasks: calculateKPI(currentAssigned.length, prevAssigned.length),
            completed: calculateKPI(currentCompleted.length, prevCompleted.length),
            timeEarned: calculateKPI(currentMinutesEarned, prevMinutesEarned),
            timeRedeemed: calculateKPI(currentMinutesRedeemed, prevMinutesRedeemed)
        };
    }, [filteredTasks, filteredRedemptions, dateRanges]);

    // Calculate daily data for chart (last 7 days from current period end)
    const dailyData = useMemo((): DailyData[] => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data: DailyData[] = [];
        const endDate = dateRanges.current.end;

        for (let i = 6; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(endDate.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const dayRange = { start: date, end: dayEnd };

            const dayCompleted = filteredTasks.filter(t =>
                t.status === 'approved' && isDateInRange(t.created_at, dayRange)
            );
            const dayRedemptions = filteredRedemptions.filter(r =>
                isDateInRange(r.created_at, dayRange)
            );

            const tasksCompleted = dayCompleted.length;
            const minutesEarned = dayCompleted.reduce((sum, t) => sum + t.reward_minutes, 0);
            const minutesRedeemed = dayRedemptions.reduce((sum, r) => sum + r.minutes_spent, 0);

            data.push({
                date: new Date(date),
                dayName: days[date.getDay()],
                tasksCompleted,
                minutesEarned,
                minutesRedeemed,
                metGoal: tasksCompleted >= DAILY_TASK_GOAL
            });
        }

        return data;
    }, [filteredTasks, filteredRedemptions, dateRanges]);

    // Chart insights
    const chartInsight = useMemo((): ChartInsight => {
        let bestDay: string | null = null;
        let maxTasks = 0;
        const missedGoalDays: string[] = [];
        let goalMetCount = 0;

        dailyData.forEach(day => {
            if (day.tasksCompleted > maxTasks) {
                maxTasks = day.tasksCompleted;
                bestDay = day.dayName;
            }
            if (day.metGoal) {
                goalMetCount++;
            } else {
                missedGoalDays.push(day.dayName);
            }
        });

        return { bestDay, missedGoalDays, goalMetCount, totalDays: dailyData.length };
    }, [dailyData]);

    // Calculate per-child analytics
    const childAnalytics = useMemo((): ChildAnalytics[] => {
        return children.map(child => {
            const childTasks = assignedTasks.filter(t => t.child_id === child.id);
            const childRedemptions = redemptions.filter(r => r.child_id === child.id);

            // Period stats
            const periodTasks = childTasks.filter(t => isDateInRange(t.created_at, dateRanges.current));
            const assignedCount = periodTasks.length;
            const activeCount = periodTasks.filter(t => t.status === 'active').length;
            const submittedCount = periodTasks.filter(t => t.status === 'ready_for_review').length;
            const approvedCount = periodTasks.filter(t => t.status === 'approved').length;
            const completionRate = assignedCount > 0 ? Math.round((approvedCount / assignedCount) * 100) : 0;

            // Time earned/redeemed in period
            const minutesEarned = periodTasks
                .filter(t => t.status === 'approved')
                .reduce((sum, t) => sum + t.reward_minutes, 0);
            const periodRedemptions = childRedemptions.filter(r => isDateInRange(r.created_at, dateRanges.current));
            const minutesRedeemed = periodRedemptions.reduce((sum, r) => sum + r.minutes_spent, 0);

            // Consistency: count unique days with any completion in last 7 days
            const now = new Date();
            const last7Days: Set<string> = new Set();
            const prior7Days: Set<string> = new Set();

            childTasks.forEach(t => {
                if (t.status === 'approved') {
                    const taskDate = new Date(t.created_at);
                    const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysDiff < 7) {
                        last7Days.add(taskDate.toDateString());
                    } else if (daysDiff < 14) {
                        prior7Days.add(taskDate.toDateString());
                    }
                }
            });

            const consistencyDaysActive = last7Days.size;
            const consistencyBand = getConsistencyBand(consistencyDaysActive);

            // Momentum: compare last 7 days completions vs prior 7 days
            const last7Completed = childTasks.filter(t => {
                if (t.status !== 'approved') return false;
                const taskDate = new Date(t.created_at);
                const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff < 7;
            }).length;

            const prior7Completed = childTasks.filter(t => {
                if (t.status !== 'approved') return false;
                const taskDate = new Date(t.created_at);
                const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff >= 7 && daysDiff < 14;
            }).length;

            const momentumDelta = last7Completed - prior7Completed;
            const momentumLabel = getMomentumLabel(momentumDelta);

            return {
                child,
                assignedCount,
                activeCount,
                submittedCount,
                approvedCount,
                completionRate,
                consistencyDaysActive,
                consistencyBand,
                momentumDelta,
                momentumLabel,
                minutesEarned,
                minutesRedeemed
            };
        });
    }, [children, assignedTasks, redemptions, dateRanges]);

    // Generate insights
    const insights = useMemo((): string[] => {
        const result: string[] = [];

        if (children.length === 0) return result;

        // Find declining children
        childAnalytics.forEach(ca => {
            if (ca.momentumLabel === 'declining') {
                const last7 = ca.approvedCount;
                // Calculate prior 7 for context
                const prior = last7 - ca.momentumDelta;
                result.push(`${ca.child.name} is declining: completed ${last7} task${last7 !== 1 ? 's' : ''} this week vs ${prior} last week.`);
            }
        });

        // Best consistency
        const bestConsistency = [...childAnalytics].sort((a, b) => b.consistencyDaysActive - a.consistencyDaysActive)[0];
        if (bestConsistency && bestConsistency.consistencyDaysActive > 0) {
            result.push(`Best consistency: ${bestConsistency.child.name} (${bestConsistency.consistencyDaysActive}/7 active days).`);
        }

        // Most productive day
        if (chartInsight.bestDay && dailyData.find(d => d.dayName === chartInsight.bestDay)?.tasksCompleted! > 0) {
            const bestDayData = dailyData.find(d => d.dayName === chartInsight.bestDay);
            result.push(`Most productive day: ${chartInsight.bestDay} (${bestDayData?.minutesEarned || 0} minutes earned).`);
        }

        // Most time redeemed
        const mostRedeemed = [...childAnalytics].sort((a, b) => b.minutesRedeemed - a.minutesRedeemed)[0];
        if (mostRedeemed && mostRedeemed.minutesRedeemed > 0) {
            result.push(`Most time redeemed: ${mostRedeemed.child.name} (${formatMinutes(mostRedeemed.minutesRedeemed)}).`);
        }

        // Pending approvals
        const pendingApprovalCount = assignedTasks.filter(t => t.status === 'ready_for_review').length;
        if (pendingApprovalCount > 0) {
            result.push(`${pendingApprovalCount} task${pendingApprovalCount !== 1 ? 's are' : ' is'} waiting for approval.`);
        }

        // Missed goal days
        if (chartInsight.missedGoalDays.length > 0 && chartInsight.missedGoalDays.length < 7) {
            result.push(`Missed daily goal: ${chartInsight.missedGoalDays.join(', ')}.`);
        }

        // Goal consistency
        if (chartInsight.goalMetCount > 0) {
            result.push(`Daily goal met ${chartInsight.goalMetCount}/${chartInsight.totalDays} days this week.`);
        }

        return result.slice(0, 6); // Max 6 insights
    }, [childAnalytics, children, chartInsight, dailyData, assignedTasks]);

    // Leaderboard sorted by selected metric
    const leaderboard = useMemo(() => {
        return [...childAnalytics].sort((a, b) => {
            switch (leaderboardMetric) {
                case 'minutesEarned':
                    return b.minutesEarned - a.minutesEarned;
                case 'approvedCount':
                    return b.approvedCount - a.approvedCount;
                case 'consistencyDaysActive':
                    return b.consistencyDaysActive - a.consistencyDaysActive;
                default:
                    return 0;
            }
        });
    }, [childAnalytics, leaderboardMetric]);

    // Sort child analytics for "Needs Attention" view (red first, then declining)
    const sortedChildAnalytics = useMemo(() => {
        return [...childAnalytics].sort((a, b) => {
            // Red consistency first
            const bandOrder = { red: 0, yellow: 1, green: 2 };
            if (bandOrder[a.consistencyBand] !== bandOrder[b.consistencyBand]) {
                return bandOrder[a.consistencyBand] - bandOrder[b.consistencyBand];
            }
            // Then by declining momentum
            const momentumOrder = { declining: 0, stable: 1, improving: 2 };
            return momentumOrder[a.momentumLabel] - momentumOrder[b.momentumLabel];
        });
    }, [childAnalytics]);

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const maxTasksInWeek = Math.max(...dailyData.map(d => d.tasksCompleted), 1);

    const getRangeLabel = () => {
        switch (timeRange) {
            case 'this_week': return 'This Week';
            case 'last_week': return 'Last Week';
            case 'last_30_days': return 'Last 30 Days';
            case 'custom': return 'Custom Range';
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-teal-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="font-bold animate-pulse">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <ChildModeGuard>
            <PremiumGate featureName="analytics">
                <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased transition-colors duration-200">
                    <ParentSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                    <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative">
                        <div className="md:hidden flex items-center justify-between p-4 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                            <div className="flex items-center gap-2">
                                <AppAvatar userId={userId || 'parent'} name={userName} size={32} style="notionists" className="rounded-lg" />
                                <span className="font-bold">Task For Time</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 text-text-main-light dark:text-text-main-dark transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </div>

                        <div className="max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
                            {/* Header with Filters */}
                            <div className="flex flex-col gap-4">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main-light dark:text-text-main-dark">
                                    Analytics
                                </h1>

                                {/* Filters Row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Time Range Selector */}
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark font-medium focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="this_week">This Week</option>
                                        <option value="last_week">Last Week</option>
                                        <option value="last_30_days">Last 30 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>

                                    {/* Custom Date Range */}
                                    {timeRange === 'custom' && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark text-sm"
                                            />
                                            <span className="text-text-sub-light dark:text-gray-400">to</span>
                                            <input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark text-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Child Filter */}
                                    {children.length > 1 && (
                                        <select
                                            value={selectedChildId}
                                            onChange={(e) => setSelectedChildId(e.target.value)}
                                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark font-medium focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            <option value="all">All Children</option>
                                            {children.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {children.length === 0 ? (
                                <div className="p-12 text-center bg-card-light dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-700">
                                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">family_restroom</span>
                                    <p className="text-lg font-medium text-gray-500 mb-2">No Children Added Yet</p>
                                    <p className="text-sm text-gray-400">Add children to your family to start tracking their progress!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Insights Panel */}
                                    {insights.length > 0 && (
                                        <div className="bg-gradient-to-r from-primary/10 to-teal-500/10 dark:from-primary/20 dark:to-teal-500/20 rounded-xl p-5 border border-primary/20">
                                            <h2 className="text-sm font-bold text-primary dark:text-primary mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                                {getRangeLabel()}&apos;s Insights
                                            </h2>
                                            <ul className="space-y-2">
                                                {insights.map((insight, i) => (
                                                    <li key={i} className="text-sm text-text-main-light dark:text-text-main-dark flex items-start gap-2">
                                                        <span className="text-primary mt-0.5">•</span>
                                                        {insight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* KPI Cards with Trends */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Total Tasks */}
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">assignment</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">
                                                {kpis.totalTasks.value}
                                            </p>
                                            <p className="text-sm text-text-sub-light dark:text-gray-400">Total Tasks</p>
                                            <div className={`text-xs mt-2 flex items-center gap-1 ${kpis.totalTasks.trend === 'up' ? 'text-green-600' :
                                                kpis.totalTasks.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {kpis.totalTasks.trend === 'up' ? 'trending_up' :
                                                        kpis.totalTasks.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                                </span>
                                                {kpis.totalTasks.delta >= 0 ? '+' : ''}{kpis.totalTasks.delta} vs prev
                                                {kpis.totalTasks.prevValue > 0 && ` (${kpis.totalTasks.deltaPct >= 0 ? '+' : ''}${kpis.totalTasks.deltaPct}%)`}
                                            </div>
                                        </div>

                                        {/* Completed */}
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">
                                                {kpis.completed.value}
                                            </p>
                                            <p className="text-sm text-text-sub-light dark:text-gray-400">Completed</p>
                                            <div className={`text-xs mt-2 flex items-center gap-1 ${kpis.completed.trend === 'up' ? 'text-green-600' :
                                                kpis.completed.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {kpis.completed.trend === 'up' ? 'trending_up' :
                                                        kpis.completed.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                                </span>
                                                {kpis.completed.delta >= 0 ? '+' : ''}{kpis.completed.delta} vs prev
                                                {kpis.completed.prevValue > 0 && ` (${kpis.completed.deltaPct >= 0 ? '+' : ''}${kpis.completed.deltaPct}%)`}
                                            </div>
                                        </div>

                                        {/* Time Earned */}
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">
                                                {formatMinutes(kpis.timeEarned.value)}
                                            </p>
                                            <p className="text-sm text-text-sub-light dark:text-gray-400">Time Earned</p>
                                            <div className={`text-xs mt-2 flex items-center gap-1 ${kpis.timeEarned.trend === 'up' ? 'text-green-600' :
                                                kpis.timeEarned.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {kpis.timeEarned.trend === 'up' ? 'trending_up' :
                                                        kpis.timeEarned.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                                </span>
                                                {kpis.timeEarned.delta >= 0 ? '+' : ''}{formatMinutes(Math.abs(kpis.timeEarned.delta))} vs prev
                                            </div>
                                        </div>

                                        {/* Time Redeemed */}
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">redeem</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">
                                                {formatMinutes(kpis.timeRedeemed.value)}
                                            </p>
                                            <p className="text-sm text-text-sub-light dark:text-gray-400">Time Redeemed</p>
                                            <div className={`text-xs mt-2 flex items-center gap-1 ${kpis.timeRedeemed.trend === 'up' ? 'text-green-600' :
                                                kpis.timeRedeemed.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {kpis.timeRedeemed.trend === 'up' ? 'trending_up' :
                                                        kpis.timeRedeemed.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                                </span>
                                                {kpis.timeRedeemed.delta >= 0 ? '+' : ''}{formatMinutes(Math.abs(kpis.timeRedeemed.delta))} vs prev
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weekly Activity Chart with Goal Line */}
                                    <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Weekly Activity</h2>
                                            <div className="flex items-center gap-2 text-xs text-text-sub-light dark:text-gray-400">
                                                <span className="w-3 h-0.5 bg-orange-500"></span>
                                                Daily goal: {DAILY_TASK_GOAL} task{DAILY_TASK_GOAL !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div className="flex items-end justify-between gap-2 h-40 relative">
                                            {/* Goal line */}
                                            <div
                                                className="absolute left-0 right-0 border-t-2 border-dashed border-orange-500/50"
                                                style={{ bottom: `${Math.min((DAILY_TASK_GOAL / maxTasksInWeek) * 120, 120)}px` }}
                                            />
                                            {dailyData.map((day, index) => (
                                                <div key={index} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                                                    <div className="w-full flex justify-center">
                                                        <div
                                                            className={`w-8 md:w-12 rounded-t-lg transition-all duration-300 relative group ${day.metGoal
                                                                ? 'bg-green-500'
                                                                : day.tasksCompleted > 0
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                                }`}
                                                            style={{
                                                                height: `${Math.max((day.tasksCompleted / maxTasksInWeek) * 120, 8)}px`,
                                                            }}
                                                        >
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                                {day.tasksCompleted} task{day.tasksCompleted !== 1 ? 's' : ''} • {formatMinutes(day.minutesEarned)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-medium ${day.metGoal
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-text-sub-light dark:text-gray-400'
                                                        }`}>{day.dayName}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Chart Insight */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-sm">
                                            {chartInsight.bestDay && dailyData.find(d => d.dayName === chartInsight.bestDay)?.tasksCompleted! > 0 && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <span className="material-symbols-outlined text-[16px]">emoji_events</span>
                                                    Best day: {chartInsight.bestDay}
                                                </span>
                                            )}
                                            {chartInsight.missedGoalDays.length > 0 && chartInsight.missedGoalDays.length < 7 && (
                                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                                    <span className="material-symbols-outlined text-[16px]">warning</span>
                                                    Missed: {chartInsight.missedGoalDays.join(', ')}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-text-sub-light dark:text-gray-400">
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                Consistency: {chartInsight.goalMetCount}/{chartInsight.totalDays} days met goal
                                            </span>
                                        </div>
                                    </div>

                                    {/* Child Progress with Signals */}
                                    {selectedChildId === 'all' && children.length > 0 && (
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Child Progress</h2>
                                                <span className="text-xs text-text-sub-light dark:text-gray-400">Sorted by: Needs attention first</span>
                                            </div>
                                            <div className="space-y-4">
                                                {sortedChildAnalytics.map((stat) => (
                                                    <div
                                                        key={stat.child.id}
                                                        className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl transition-colors ${stat.consistencyBand === 'red'
                                                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                            : stat.consistencyBand === 'yellow'
                                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                                                : 'bg-gray-50 dark:bg-gray-800/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <AppAvatar
                                                                userId={stat.child.id}
                                                                name={stat.child.name}
                                                                size={48}
                                                                style="adventurer"
                                                            />
                                                            <div>
                                                                <h3 className="font-bold text-text-main-light dark:text-text-main-dark">{stat.child.name}</h3>
                                                                <span className="text-xs text-primary">Level {stat.child.level}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                                            {/* Completed */}
                                                            <div className="flex flex-col">
                                                                <span className="text-text-sub-light dark:text-gray-400 text-xs">Completed</span>
                                                                <span className="font-bold text-green-600 dark:text-green-400">{stat.approvedCount}</span>
                                                            </div>

                                                            {/* Active */}
                                                            <div className="flex flex-col">
                                                                <span className="text-text-sub-light dark:text-gray-400 text-xs">Active</span>
                                                                <span className="font-bold text-blue-600 dark:text-blue-400">{stat.activeCount}</span>
                                                            </div>

                                                            {/* Pending Review */}
                                                            <div className="flex flex-col">
                                                                <span className="text-text-sub-light dark:text-gray-400 text-xs">Pending Review</span>
                                                                <span className={`font-bold ${stat.submittedCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                                                                    {stat.submittedCount}
                                                                </span>
                                                            </div>

                                                            {/* Consistency */}
                                                            <div className="flex flex-col">
                                                                <span className="text-text-sub-light dark:text-gray-400 text-xs">Consistency</span>
                                                                <span className={`font-bold flex items-center gap-1 ${stat.consistencyBand === 'green' ? 'text-green-600 dark:text-green-400' :
                                                                    stat.consistencyBand === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                                                        'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                    {stat.consistencyDaysActive}/7
                                                                    <span className={`w-2 h-2 rounded-full ${stat.consistencyBand === 'green' ? 'bg-green-500' :
                                                                        stat.consistencyBand === 'yellow' ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                        }`}></span>
                                                                </span>
                                                            </div>

                                                            {/* Momentum */}
                                                            <div className="flex flex-col">
                                                                <span className="text-text-sub-light dark:text-gray-400 text-xs">Momentum</span>
                                                                <span className={`font-bold flex items-center gap-1 ${stat.momentumLabel === 'improving' ? 'text-green-600 dark:text-green-400' :
                                                                    stat.momentumLabel === 'declining' ? 'text-red-600 dark:text-red-400' :
                                                                        'text-gray-500'
                                                                    }`}>
                                                                    <span className="material-symbols-outlined text-[14px]">
                                                                        {stat.momentumLabel === 'improving' ? 'trending_up' :
                                                                            stat.momentumLabel === 'declining' ? 'trending_down' : 'trending_flat'}
                                                                    </span>
                                                                    {stat.momentumLabel}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Completion Rate */}
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-2xl font-black text-primary">{stat.completionRate}%</div>
                                                            <div className="text-xs text-text-sub-light dark:text-gray-400">Completion</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Leaderboard with Metric Toggle */}
                                    {children.length > 1 && (
                                        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                                                    Leaderboard
                                                </h2>
                                                <select
                                                    value={leaderboardMetric}
                                                    onChange={(e) => setLeaderboardMetric(e.target.value as LeaderboardMetric)}
                                                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="minutesEarned">Time Earned</option>
                                                    <option value="approvedCount">Tasks Completed</option>
                                                    <option value="consistencyDaysActive">Consistency Streak</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                {leaderboard.map((stat, index) => {
                                                    const metricValue = leaderboardMetric === 'minutesEarned'
                                                        ? formatMinutes(stat.minutesEarned)
                                                        : leaderboardMetric === 'approvedCount'
                                                            ? `${stat.approvedCount} tasks`
                                                            : `${stat.consistencyDaysActive}/7 days`;

                                                    return (
                                                        <div
                                                            key={stat.child.id}
                                                            className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${index === 0
                                                                ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800'
                                                                : 'bg-gray-50 dark:bg-gray-800/50'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                                                    index === 2 ? 'bg-orange-300 text-orange-800' :
                                                                        'bg-gray-200 text-gray-600'
                                                                }`}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 flex items-center gap-3">
                                                                <AppAvatar
                                                                    userId={stat.child.id}
                                                                    name={stat.child.name}
                                                                    size={40}
                                                                    style="adventurer"
                                                                />
                                                                <span className="font-bold text-text-main-light dark:text-text-main-dark">{stat.child.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-bold text-primary text-lg">{metricValue}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </PremiumGate>
        </ChildModeGuard>
    );
}
