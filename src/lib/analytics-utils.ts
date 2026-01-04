/**
 * Analytics Utility Functions
 *
 * Pure utility functions for analytics calculations.
 * These functions are separated from the main component for easier testing.
 *
 * FORMULAS USED:
 *
 * 1. COMPLETION RATE
 *    Formula: (approvedCount / assignedCount) * 100
 *    - approvedCount: Tasks with status === 'approved' in the selected period
 *    - assignedCount: Tasks assigned (created_at in period) in the selected period
 *    - Returns 0 if assignedCount is 0 (avoid division by zero)
 *
 * 2. CONSISTENCY SCORE / BAND
 *    Formula: Count unique days with at least one approved task in last 7 days
 *    - Green: 5-7 days active
 *    - Yellow: 2-4 days active
 *    - Red: 0-1 days active
 *
 * 3. MOMENTUM
 *    Formula: last7DaysCompletions - prior7DaysCompletions
 *    - improving: delta > 0
 *    - stable: delta === 0
 *    - declining: delta < 0
 *
 * 4. GOAL MET LOGIC
 *    Formula: tasksCompletedOnDay >= DAILY_TASK_GOAL (default: 1)
 *    - Returns true if child completed at least DAILY_TASK_GOAL tasks on that day
 */

export type ConsistencyBand = 'green' | 'yellow' | 'red';
export type MomentumLabel = 'improving' | 'stable' | 'declining';
export type Trend = 'up' | 'down' | 'flat';

export interface KPIData {
    value: number;
    prevValue: number;
    delta: number;
    deltaPct: number;
    trend: Trend;
}

export interface DateRange {
    start: Date;
    end: Date;
}

/**
 * Calculate KPI data with trend information
 */
export function calculateKPI(current: number, previous: number): KPIData {
    const delta = current - previous;
    const deltaPct = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0);
    let trend: Trend = 'flat';
    if (delta > 0) trend = 'up';
    else if (delta < 0) trend = 'down';

    return { value: current, prevValue: previous, delta, deltaPct, trend };
}

/**
 * Get consistency band based on days active in last 7 days
 * Green: 5-7 days, Yellow: 2-4 days, Red: 0-1 days
 */
export function getConsistencyBand(daysActive: number): ConsistencyBand {
    if (daysActive >= 5) return 'green';
    if (daysActive >= 2) return 'yellow';
    return 'red';
}

/**
 * Get momentum label based on delta between periods
 */
export function getMomentumLabel(delta: number): MomentumLabel {
    if (delta > 0) return 'improving';
    if (delta < 0) return 'declining';
    return 'stable';
}

/**
 * Calculate completion rate for a set of tasks
 */
export function calculateCompletionRate(approvedCount: number, assignedCount: number): number {
    if (assignedCount === 0) return 0;
    return Math.round((approvedCount / assignedCount) * 100);
}

/**
 * Check if a date falls within a range
 */
export function isDateInRange(date: Date | string, range: DateRange): boolean {
    const d = new Date(date);
    return d >= range.start && d <= range.end;
}

/**
 * Check if daily goal was met
 */
export function isGoalMet(tasksCompleted: number, dailyGoal: number = 1): boolean {
    return tasksCompleted >= dailyGoal;
}

/**
 * Format minutes to human-readable string
 */
export function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Count unique days with activity from a list of dates
 */
export function countUniqueDaysWithActivity(dates: (Date | string)[]): number {
    const uniqueDays = new Set<string>();
    dates.forEach(d => {
        const date = new Date(d);
        uniqueDays.add(date.toDateString());
    });
    return uniqueDays.size;
}

// ============================================================================
// ACCEPTANCE TESTS - These verify the formulas are correct
// Run by importing this module and calling runAcceptanceTests()
// ============================================================================

interface TestResult {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
}

function assertEqual<T>(actual: T, expected: T, name: string): TestResult {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    return {
        name,
        passed,
        expected: JSON.stringify(expected),
        actual: JSON.stringify(actual)
    };
}

/**
 * Test 1: Completion rate uses completed/assigned for the selected period
 */
function testCompletionRate(): TestResult[] {
    const results: TestResult[] = [];

    // Case 1: 3 approved out of 10 assigned = 30%
    results.push(assertEqual(
        calculateCompletionRate(3, 10),
        30,
        'Completion rate: 3/10 = 30%'
    ));

    // Case 2: 0 approved out of 5 assigned = 0%
    results.push(assertEqual(
        calculateCompletionRate(0, 5),
        0,
        'Completion rate: 0/5 = 0%'
    ));

    // Case 3: 0 assigned = 0% (avoid division by zero)
    results.push(assertEqual(
        calculateCompletionRate(0, 0),
        0,
        'Completion rate: 0/0 = 0% (no division by zero)'
    ));

    // Case 4: All approved = 100%
    results.push(assertEqual(
        calculateCompletionRate(7, 7),
        100,
        'Completion rate: 7/7 = 100%'
    ));

    return results;
}

/**
 * Test 2: Consistency band matches days active logic
 */
function testConsistencyBand(): TestResult[] {
    const results: TestResult[] = [];

    // Green: 5-7 days
    results.push(assertEqual(getConsistencyBand(5), 'green', 'Consistency: 5 days = green'));
    results.push(assertEqual(getConsistencyBand(6), 'green', 'Consistency: 6 days = green'));
    results.push(assertEqual(getConsistencyBand(7), 'green', 'Consistency: 7 days = green'));

    // Yellow: 2-4 days
    results.push(assertEqual(getConsistencyBand(2), 'yellow', 'Consistency: 2 days = yellow'));
    results.push(assertEqual(getConsistencyBand(3), 'yellow', 'Consistency: 3 days = yellow'));
    results.push(assertEqual(getConsistencyBand(4), 'yellow', 'Consistency: 4 days = yellow'));

    // Red: 0-1 days
    results.push(assertEqual(getConsistencyBand(0), 'red', 'Consistency: 0 days = red'));
    results.push(assertEqual(getConsistencyBand(1), 'red', 'Consistency: 1 day = red'));

    return results;
}

/**
 * Test 3: Momentum label changes when last 7 days differs from prior 7 days
 */
function testMomentumLabel(): TestResult[] {
    const results: TestResult[] = [];

    // Improving: delta > 0
    results.push(assertEqual(getMomentumLabel(5), 'improving', 'Momentum: +5 = improving'));
    results.push(assertEqual(getMomentumLabel(1), 'improving', 'Momentum: +1 = improving'));

    // Stable: delta = 0
    results.push(assertEqual(getMomentumLabel(0), 'stable', 'Momentum: 0 = stable'));

    // Declining: delta < 0
    results.push(assertEqual(getMomentumLabel(-1), 'declining', 'Momentum: -1 = declining'));
    results.push(assertEqual(getMomentumLabel(-5), 'declining', 'Momentum: -5 = declining'));

    return results;
}

/**
 * Test 4: Leaderboard ranks correctly by selected metric
 */
function testLeaderboardRanking(): TestResult[] {
    const results: TestResult[] = [];

    interface MockChild {
        name: string;
        minutesEarned: number;
        approvedCount: number;
        consistencyDaysActive: number;
    }

    const children: MockChild[] = [
        { name: 'Alice', minutesEarned: 100, approvedCount: 5, consistencyDaysActive: 3 },
        { name: 'Bob', minutesEarned: 200, approvedCount: 3, consistencyDaysActive: 6 },
        { name: 'Charlie', minutesEarned: 150, approvedCount: 8, consistencyDaysActive: 4 }
    ];

    // Sort by minutes earned (descending)
    const byMinutes = [...children].sort((a, b) => b.minutesEarned - a.minutesEarned);
    results.push(assertEqual(
        byMinutes.map(c => c.name),
        ['Bob', 'Charlie', 'Alice'],
        'Leaderboard by Time Earned: Bob > Charlie > Alice'
    ));

    // Sort by tasks completed (descending)
    const byTasks = [...children].sort((a, b) => b.approvedCount - a.approvedCount);
    results.push(assertEqual(
        byTasks.map(c => c.name),
        ['Charlie', 'Alice', 'Bob'],
        'Leaderboard by Tasks Completed: Charlie > Alice > Bob'
    ));

    // Sort by consistency (descending)
    const byConsistency = [...children].sort((a, b) => b.consistencyDaysActive - a.consistencyDaysActive);
    results.push(assertEqual(
        byConsistency.map(c => c.name),
        ['Bob', 'Charlie', 'Alice'],
        'Leaderboard by Consistency: Bob > Charlie > Alice'
    ));

    return results;
}

/**
 * Test 5: Insights include a "needs attention" message when a child declines
 */
function testInsightsNeedsAttention(): TestResult[] {
    const results: TestResult[] = [];

    // Mock child analytics
    interface MockChildAnalytics {
        name: string;
        momentumLabel: MomentumLabel;
        momentumDelta: number;
        approvedCount: number;
    }

    const childAnalytics: MockChildAnalytics[] = [
        { name: 'Peter', momentumLabel: 'declining', momentumDelta: -2, approvedCount: 0 },
        { name: 'Tinashe', momentumLabel: 'improving', momentumDelta: 3, approvedCount: 5 },
        { name: 'James', momentumLabel: 'stable', momentumDelta: 0, approvedCount: 2 }
    ];

    // Generate insights
    const insights: string[] = [];
    childAnalytics.forEach(ca => {
        if (ca.momentumLabel === 'declining') {
            const prior = ca.approvedCount - ca.momentumDelta;
            insights.push(`${ca.name} is declining: completed ${ca.approvedCount} task${ca.approvedCount !== 1 ? 's' : ''} this week vs ${prior} last week.`);
        }
    });

    // Verify declining child gets an insight
    const peterInsight = insights.find(i => i.includes('Peter'));
    results.push(assertEqual(
        !!peterInsight,
        true,
        'Insights include message for declining child (Peter)'
    ));

    results.push(assertEqual(
        peterInsight?.includes('declining'),
        true,
        'Declining insight contains the word "declining"'
    ));

    // Verify non-declining children don't get decline insight
    const tinasheDeclineInsight = insights.find(i => i.includes('Tinashe') && i.includes('declining'));
    results.push(assertEqual(
        !tinasheDeclineInsight,
        true,
        'Improving child (Tinashe) does not get declining insight'
    ));

    return results;
}

/**
 * Test 6: Goal met logic
 */
function testGoalMetLogic(): TestResult[] {
    const results: TestResult[] = [];

    // Default goal is 1 task
    results.push(assertEqual(isGoalMet(0, 1), false, 'Goal: 0 tasks, need 1 = not met'));
    results.push(assertEqual(isGoalMet(1, 1), true, 'Goal: 1 task, need 1 = met'));
    results.push(assertEqual(isGoalMet(5, 1), true, 'Goal: 5 tasks, need 1 = met'));

    // Custom goal
    results.push(assertEqual(isGoalMet(2, 3), false, 'Goal: 2 tasks, need 3 = not met'));
    results.push(assertEqual(isGoalMet(3, 3), true, 'Goal: 3 tasks, need 3 = met'));

    return results;
}

/**
 * Run all acceptance tests and return results
 */
export function runAcceptanceTests(): { passed: number; failed: number; results: TestResult[] } {
    const allResults: TestResult[] = [
        ...testCompletionRate(),
        ...testConsistencyBand(),
        ...testMomentumLabel(),
        ...testLeaderboardRanking(),
        ...testInsightsNeedsAttention(),
        ...testGoalMetLogic()
    ];

    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.filter(r => !r.passed).length;

    return { passed, failed, results: allResults };
}

/**
 * Log test results to console
 */
export function logTestResults(): void {
    const { passed, failed, results } = runAcceptanceTests();

    console.log('\n====== ANALYTICS ACCEPTANCE TESTS ======\n');

    results.forEach(r => {
        const status = r.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`${status}: ${r.name}`);
        if (!r.passed) {
            console.log(`  Expected: ${r.expected}`);
            console.log(`  Actual:   ${r.actual}`);
        }
    });

    console.log(`\n====== SUMMARY ======`);
    console.log(`Passed: ${passed}/${passed + failed}`);
    console.log(`Failed: ${failed}/${passed + failed}`);

    if (failed === 0) {
        console.log('\n All acceptance tests passed!\n');
    } else {
        console.log('\n Some tests failed. Please review the failures above.\n');
    }
}
