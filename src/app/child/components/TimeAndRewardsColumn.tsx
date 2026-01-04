import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Reward = Database['public']['Tables']['rewards']['Row'];

interface TimeAndRewardsColumnProps {
    timeBankMinutes: number;
    rewards: Reward[];
    childId: string;
    onRedeem: () => void;
}

export function TimeAndRewardsColumn({ timeBankMinutes, rewards, childId, onRedeem }: TimeAndRewardsColumnProps) {
    const hours = Math.floor(timeBankMinutes / 60);
    const minutes = timeBankMinutes % 60;

    const handleRedeem = async (rewardId: string, cost: number) => {
        if (timeBankMinutes < cost) {
            alert("Oops! Not enough minutes in your Time Bank yet. Keep going!");
            return;
        }

        const { error } = await supabase.rpc('redeem_reward', {
            reward_id: rewardId,
            child_id: childId
        });

        if (error) {
            console.error("Redemption error:", error);
            alert("Something went wrong. Please try again or ask a parent.");
            return;
        }

        onRedeem();
    };

    return (
        <aside className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
            <div className="bg-gradient-to-br from-teal-900 to-teal-800 dark:from-card-dark dark:to-black rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
                </div>
                <h2 className="text-sm font-bold text-teal-300 uppercase tracking-wider mb-2">My Time Bank</h2>
                <div className="text-5xl font-black mb-6 tracking-tight flex items-baseline gap-2">
                    {hours}h {minutes}m
                    <span className="text-lg font-medium text-teal-300">available</span>
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm py-2 rounded-lg text-sm font-bold transition-colors">
                        History
                    </button>
                    <button className="flex-1 bg-primary text-teal-900 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-white transition-colors">
                        Use Now
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2 text-teal-900 dark:text-white">
                    <span className="material-symbols-outlined text-yellow-500 fill-1">stars</span>
                    Rewards
                </h2>
                <div className="space-y-6 flex-1">
                    {rewards.length === 0 ? (
                        <p className="text-center text-sm text-text-sub-light py-4 italic">
                            No rewards available yet. Ask a parent to add some!
                        </p>
                    ) : (
                        rewards.map((reward) => (
                            <div key={reward.id} className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                                    <span className="material-symbols-outlined">{reward.icon || 'star'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{reward.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cost: {Math.floor(reward.cost_minutes / 60)}h {reward.cost_minutes % 60}m</p>
                                </div>
                                <button
                                    onClick={() => handleRedeem(reward.id, reward.cost_minutes)}
                                    className="text-xs font-bold text-primary-dark dark:text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                >
                                    Redeem
                                </button>
                            </div>
                        ))
                    )}

                    <hr className="border-gray-100 dark:border-gray-800" />
                    {/* Hardcoded Lego Set Goal preserved as it's a specific UI element not yet in schema */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">toys</span>
                                Lego Set Goal
                            </h4>
                            <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">45%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                            <span>2h 15m Saved</span>
                            <span>Target: 5h</span>
                        </div>
                    </div>
                </div>
                <button className="w-full mt-6 py-3 text-sm text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-900/20 font-bold hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-xl transition-colors flex items-center justify-center gap-2">
                    See All Rewards
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </div>
        </aside>
    );
}
